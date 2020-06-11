package com.pages;
import java.util.List;
import net.bytebuddy.utility.RandomString;
import org.apache.commons.lang3.StringEscapeUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.apache.commons.lang3.RandomStringUtils;
import org.openqa.selenium.support.ui.WebDriverWait;


public class Base {



        WebDriver driver;

        public Base(WebDriver driver) {
            this.driver = driver;
        }

        public void Click(WebElement el) {
            WebDriverWait wait=new WebDriverWait(driver, 15);
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("arguments[0].setAttribute('style', arguments[1]);", el, "border: 3px solid red;");
            wait.until(ExpectedConditions.elementToBeClickable(el));
            el.click();
        }

        public void FillText(WebElement el, String txt) {

            WebDriverWait wait=new WebDriverWait(driver, 15);
            wait.until(ExpectedConditions.visibilityOf(el));
            el.clear();
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("arguments[0].setAttribute('style', arguments[1]);", el, "border: 3px solid blue;");
            el.sendKeys(txt);
        }

        public String GetTxt(WebElement el) {

            WebDriverWait wait=new WebDriverWait(driver, 10);
            wait.until(ExpectedConditions.visibilityOf(el));
            return el.getText();
        }

        public String GeTextInput(WebElement el)
        {
            return el.getAttribute("value");


        }
        public List<WebElement> result(WebElement el, String locator) {

            return el.findElements(By.cssSelector(locator));


        }

        public void sleep(int x) throws InterruptedException {
            Thread.sleep(x);

        }

        public void select(WebElement e, int index) {

            Select options = new Select(e);

            options.selectByIndex(index);


        }

        public void MouseActions(WebElement el) {

            Actions action = new Actions(driver);
            action.click(el).perform();

        }
//scroling until element is display

        public void Scroll (WebElement el) {


            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("arguments[0].scrollIntoView();",el);

        }
        public String rand(int choise, int len) {
            String create = "";
            switch (choise) {
                case (1):
                    create = RandomStringUtils.random(len, true, true);
                    break;
                case (2):
                    create = RandomStringUtils.random(len, "!@שרוןפפפפפ#%$^GJJKKaaa");
                    break;
                case (3):
                    create = RandomStringUtils.random(len, "");
                    break;
                default:
                    create = RandomStringUtils.random(len);
            }
            return create;
        }

    }
