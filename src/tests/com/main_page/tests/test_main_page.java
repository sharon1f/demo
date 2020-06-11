package com.main_page.tests;

import com.pages.Ebay;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.WebElement;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Parameters;
import org.testng.annotations.Test;
import com.browser.Browser_Select;


public class test_main_page {


    WebDriver driver;
    Ebay ebay;

    @BeforeClass
    public void setup() {

        driver = Browser_Select.getDriver("chrome");
        driver.get("http://automationpractice.com/index.php?controller=authentication");
        ebay = new Ebay(driver);
    }

    @Test(priority = 0, groups = "sanity")
    public void TestPassLogin() throws InterruptedException {

        Assert.assertEquals(true, ebay.IsPageUpload(), "faild to load page");
        Assert.assertEquals(ebay.LogIn(), "Sign out", "unable to log in");


    }

    @Test(priority = 1, groups = "sanity")
    public void TestWrongPasswordLogin() {

        Assert.assertEquals(true, ebay.IsPageUpload(), "faild to load page");
        Assert.assertEquals(true, ebay.WrongPasswordLogIn(), "fail test");


    }

    @Test(priority = 2, groups = "sanity")
    public void TestWrongUserNameLogin() {

        Assert.assertEquals(true, ebay.IsPageUpload(), "faild to load page");
        Assert.assertEquals(true, ebay.WrongUserLogIn(), "test fail");


    }

    @Test(priority = 3, groups = "sanity")
    public void IsMyAccountLoad() {

        Assert.assertEquals(true, ebay.IsPageUpload(), "faild to load page");
        Assert.assertEquals(true, ebay.IsMyAccountLoad(), "test fail");


    }
    @AfterClass
    public void TearDown() {
        driver.quit();

    }
}

