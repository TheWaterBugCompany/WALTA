'use strict';

const BaseScreen = require('./base-screen');

class LoginScreen extends BaseScreen {
    constructor( world ) {
        super( world );
    }
    async login( email, password ) {
        await this.enter('login_email_textfield', email );
        await this.enter('login_password_textfield', password );
        await this.click('login_login_button');
        if (this.isIos()) await this.dismissSavePasswordSheet();
    }

    // iOS pops a system-level "Save Password?" sheet after the login form
    // submits. It persists across walta://reset because it's a system
    // overlay, not a UIAlertController. Each cucumber run gets a fresh
    // simulator, so we assume the sheet will appear once per run — wait
    // for it and dismiss it deterministically. If it doesn't appear in
    // the window, throw — silent return is what previously let the sheet
    // leak into later scenarios and block their first screen-wait.
    async dismissSavePasswordSheet() {
        const btn = await this.driver.$("-ios predicate string:label == 'Not Now'");
        await btn.waitForDisplayed({
            timeout: 60000,
            timeoutMsg: "iOS Save Password 'Not Now' button never appeared after login — fresh-sim assumption may be wrong (see WB-87)",
        });
        await btn.click();
        await btn.waitForDisplayed({ timeout: 5000, reverse: true });
    }
} 
module.exports = LoginScreen
/*     def trait
      "* marked:'Log in with your existing account:'"
    end

    def log_in( email, password )
      wait_for_elements_exist( [email_field,password_field] )
     
      enter_text(email_field, email)
      hide_keyboard_and_wait
      enter_text(password_field, password)
      hide_keyboard_and_wait
      select('Log In')
      return page(MenuScreen).await
    end

    def email_field
      field("Email.")
    end

    def password_field
      field("Password.")
    end */
