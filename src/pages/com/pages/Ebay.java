package com.pages;


import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.*;

import java.util.List;


public class Ebay extends Base {
    @FindBy(how = How.CSS, using = (".logout"))
    public WebElement login;
    @FindBy(how = How.CSS, using = ("#email"))
    public WebElement user;
    @FindBy(how = How.CSS,using = ("#passwd"))
    public WebElement pass;
    @FindBy(how = How.CSS,using = ("#SubmitLogin"))
    public WebElement loginbutton;
    @FindBy(how = How.CSS,using = (".logo.img-responsive"))
    public WebElement logo;
    @FindBy(how = How.CSS,using = (".logout"))
    public WebElement logout;
    @FindBy(how = How.CSS,using = (".alert"))
    public List <WebElement> error;
    @FindBy(how = How.CSS,using = (".alert"))
    public List <WebElement> error2;
    @FindBy(how = How.XPATH,using = ("//*[@class='myaccount-link-list'] //*[@title='Orders']"))
    public WebElement order;

    public Ebay(WebDriver driver) {
        super(driver);
        PageFactory.initElements(driver, this);

    }


    public boolean IsPageUpload() {
      String text= logo.getAttribute("alt");
      System.out.println(text);
        if (text.isEmpty())
         return false;
          else return true;

    }

    public String LogIn() throws InterruptedException {
        FillText(user, "sharonfaduck@gmail.com");
        FillText(pass, "emma0310");
        Click(loginbutton);
        Thread.sleep(2000);
        String login1=login.getText();
        logout.click();
        return login1;

    }

    public boolean WrongPasswordLogIn() {
        FillText(user, "sharonfaduck@gmail.com");
        FillText(pass, "emma0000");
        Click(loginbutton);

        if (error.get(0).getText().isEmpty())

            return false;
        else {

            return true;
        }

    }
    public boolean WrongUserLogIn(){
        FillText(user,"sharonfaduck@walla.co.il");
        FillText(pass,"emma0310");
        Click(loginbutton);

        if  (error2.get(0).getText().isEmpty())
            return false;
        else return true;

    }
    public boolean IsMyAccountLoad(){
        FillText(user,"sharonfaduck@gmail.com");
        FillText(pass,"emma0310");
        Click(loginbutton);
       if (order.isEnabled())
           return true;
       else return false;



    }
}