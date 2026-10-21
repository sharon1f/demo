// check-shipping.mjs
// Checks if an Amazon product ships FREE to Israel, and sends a Telegram message.
import { chromium } from 'playwright';
import fs from 'node:fs';

const PRODUCT_URL = process.env.PRODUCT_URL;           // e.g. https://www.amazon.com/dp/B0XXXXXXX
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;       // optional
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;          // optional

if (!PRODUCT_URL) throw new Error('PRODUCT_URL is not set');

async function notify(text) {
  console.log(text);
  if (!TG_TOKEN || !TG_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text }),
  });
}

async function setDeliveryToIsrael(page) {
  await page.locator('#nav-global-location-popover-link').click();

  const dropdown = page.locator('#GLUXCountryListDropdown');
  await dropdown.waitFor({ state: 'visible', timeout: 15_000 });
  await dropdown.click();

  // 1) Click the visible link in the custom dropdown list (not the hidden native <option>)
  const israelLink = page
    .locator('a.a-dropdown-link:visible')
    .filter({ hasText: /^\s*Israel\s*$/ })
    .first();

  try {
    await israelLink.click({ timeout: 8_000 });
  } catch {
    // 2) Fallback: set the hidden native <select> directly and fire a change event
    console.log('Visible Israel link not found, setting the native select instead');
    const ok = await page.evaluate(() => {
      const sel = document.querySelector('#GLUXCountryList');
      if (!sel) return false;
      sel.value = 'IL';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return sel.value === 'IL';
    });
    if (!ok) throw new Error('Could not select Israel in the country list');
  }

  console.log(
    'Dropdown now shows:',
    (await page.locator('#GLUXCountryListDropdown').innerText().catch(() => '?')).trim(),
  );

  // Click the VISIBLE "Done" button (the #GLUXConfirmClose input is hidden on this screen)
  const done = page
    .locator('.a-popover-wrapper .a-button-text:visible')
    .filter({ hasText: /^\s*Done\s*$/ })
    .first();

  try {
    await done.click({ timeout: 8_000 });
  } catch {
    const visibleButtons = await page.locator('.a-popover-wrapper .a-button-text:visible').allInnerTexts();
    console.log('Visible Done button not found. Visible popup buttons:', visibleButtons.join(' | '));

    // Fallback: trigger the known Done/confirm inputs directly
    const clicked = await page.evaluate(() => {
      const selectors = ['#GLUXCountryChangeButton input', 'input[name="glowDoneButton"]', '#GLUXConfirmClose'];
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) {
          el.click();
          return s;
        }
      }
      return null;
    });
    if (!clicked) throw new Error('Could not find a Done button in the location popup');
    console.log('Clicked via JS:', clicked);
  }
  // Amazon reloads the page itself after "Done": let that finish before navigating again
  await page.waitForTimeout(3_000);
  await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
}

// Amazon sometimes shows "Click the button below to continue shopping" before the page
async function passInterstitial(page) {
  for (let i = 0; i < 2; i++) {
    const btn = page.getByRole('button', { name: /continue shopping/i });
    if ((await btn.count()) === 0) return;
    console.log('Amazon interstitial detected, clicking "Continue shopping"');
    await btn.first().click();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2_000);
  }
}

async function gotoWithRetry(page, url, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await passInterstitial(page);
      return;
    } catch (err) {
      if (i === attempts || !/ERR_ABORTED/.test(String(err))) throw err;
      console.log(`goto aborted (attempt ${i}), retrying...`);
      await page.waitForTimeout(3_000);
    }
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({
  locale: 'en-US',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
});
const page = await context.newPage();

let status = 'UNKNOWN';
let details = '';
let productName = '';

try {
  await gotoWithRetry(page, PRODUCT_URL);

  // Bot-check / captcha detection
  const pageTitle = await page.title();
  console.log('First page title:', pageTitle);
  const isCaptcha =
    (await page.locator('form[action*="validateCaptcha"], input#captchacharacters').count()) > 0 ||
    /Robot Check|Sorry! Something went wrong/i.test(pageTitle);

  if (isCaptcha) {
    status = 'BLOCKED';
    details = `Amazon showed a captcha / robot check (page title: ${pageTitle}).`;
  } else {
    await setDeliveryToIsrael(page);
    await gotoWithRetry(page, PRODUCT_URL);

    const title = (await page.locator('#productTitle').textContent().catch(() => ''))?.trim();
    const deliveryText = (
      await page
        .locator('#deliveryBlockMessage, #mir-layout-DELIVERY_BLOCK, #amazonGlobal_feature_div, #desktop_buybox')
        .allInnerTexts()
    )
      .join('\n')
      .replace(/\s+/g, ' ');

    productName = title || '';
    details = `${title || PRODUCT_URL}\n${deliveryText.slice(0, 400)}`;

    if (/cannot be shipped|does not ship to|not available for delivery/i.test(deliveryText)) {
      status = 'NOT_SHIPPABLE';
    } else if (/FREE\s+(delivery|shipping)/i.test(deliveryText) && /Israel/i.test(deliveryText)) {
      status = 'FREE_SHIPPING';
    } else if (/Israel/i.test(deliveryText)) {
      status = 'PAID_SHIPPING';
    }
  }
} catch (err) {
  status = 'ERROR';
  details = String(err);
} finally {
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/result.png', fullPage: true }).catch(() => {});
  await browser.close();
}

const shortName = (productName || 'the product').slice(0, 80);
const headlines = {
  FREE_SHIPPING: `✅ FREE shipping to Israel is available!\n${shortName}`,
  PAID_SHIPPING: `❌ NOT free shipping to Israel.\nThe product ships to Israel, but shipping is not free.\n${shortName}`,
  NOT_SHIPPABLE: `❌ This product does NOT ship to Israel.\n${shortName}`,
  UNKNOWN: `⚠️ Could not determine the shipping status.\nThe page loaded, but no delivery info for Israel was found.`,
  BLOCKED: `⚠️ Amazon blocked the check today.\nNothing could be verified.`,
  ERROR: `⚠️ The check failed with an error.`,
};

const message = [
  headlines[status] ?? `Amazon shipping check: ${status}`,
  status === 'FREE_SHIPPING' ? '' : `\nDetails: ${details.slice(0, 500)}`,
  `\n${PRODUCT_URL}`,
].join('\n');

// Always send a message, so you get a clear answer every day
await notify(message);

if (status === 'ERROR') process.exit(1);
