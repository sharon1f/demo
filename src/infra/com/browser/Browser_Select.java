package com.browser;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.firefox.ProfilesIni;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.safari.SafariDriver;

import java.util.concurrent.TimeUnit;


public class Browser_Select {


    public static WebDriver driver;


    public static WebDriver getDriver(String getBrowse) {
        //read the driver according to your definition

        switch (getBrowse.toLowerCase()) {
            case "fireFox":
                ProfilesIni profile = new ProfilesIni();
                FirefoxProfile ffprofile = profile.getProfile("SELENIUM");
                driver= new FirefoxDriver();
                break;
            case "chrome":
                //System.setProperty("webdriver.chrome.driver", "C:\\Users\\sharon.fediuk\\workspace\\chromedriver.exe");
//                DesiredCapabilities capabilities = DesiredCapabilities.chrome();
//                ChromeOptions options = new ChromeOptions();
//                options.addArguments("--incognito");
//                capabilities.setCapability(ChromeOptions.CAPABILITY, options);
                WebDriverManager.chromedriver().browserVersion("81.0.4044.138").setup();
                 driver = new ChromeDriver();
                driver.manage().timeouts().implicitlyWait(2 ,TimeUnit.SECONDS) ;
                driver.manage().window().maximize();
            //    ChromeOptions options = new ChromeOptions();
              //  options.addArguments("--disable-notifications", "start-maximized");
               // driver = new ChromeDriver(options);
                break;

            case "ie":
                System.setProperty("webdriver.ie.driver", "C:\\Automation\\drivers\\IEDriverServer.exe");

                driver = new InternetExplorerDriver();
                break;
            case "safari":
                driver = new SafariDriver();
                break;


            default:
                driver= new FirefoxDriver();
                break;
        }


        return driver;

    }

}
