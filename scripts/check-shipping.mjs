// check-shipping.mjs
// Checks if an Amazon product ships FREE to Israel, and sends a Telegram message.
import { chromium } from 'playwright';
import fs from 'node:fs';

const PRODUCT_URL = process.env.PRODUCT_URL;           // e.g. https://www.amazon.com/dp/B0XXXXXXX
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;       // optional
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;          // optional
const NOTIFY_ALWAYS = process.env.NOTIFY_ALWAYS === 'true'; // true = message every day

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
  await page.locator('#GLUXCountryListDropdown').click();
  // Country list items carry the country code in data-value, e.g. {"stringVal":"IL"}
  await page.locator('a[data-value*="\\"IL\\""]').first().click();
  await page.locator('button[name="glowDoneButton"], #GLUXConfirmClose, .a-popover-footer button').first().click();
  await page.waitForLoadState('domcontentloaded');
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

try {
  await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Bot-check / captcha detection
  const html = await page.content();
  if (/captcha|Enter the characters you see below|Robot Check/i.test(html)) {
    status = 'BLOCKED';
    details = 'Amazon showed a captcha / robot check.';
  } else {
    await setDeliveryToIsrael(page);
    await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const title = (await page.locator('#productTitle').textContent().catch(() => ''))?.trim();
    const deliveryText = (
      await page
        .locator('#deliveryBlockMessage, #mir-layout-DELIVERY_BLOCK, #amazonGlobal_feature_div, #desktop_buybox')
        .allInnerTexts()
    )
      .join('\n')
      .replace(/\s+/g, ' ');

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

const message = `Amazon shipping check: ${status}\n${details}\n${PRODUCT_URL}`;

if (status === 'FREE_SHIPPING' || status === 'BLOCKED' || status === 'ERROR' || NOTIFY_ALWAYS) {
  await notify(message);
} else {
  console.log(message);
}

if (status === 'ERROR') process.exit(1);
