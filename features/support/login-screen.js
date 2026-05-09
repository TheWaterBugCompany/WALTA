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
    // submits and persists across app terminations into the next scenario,
    // occluding the menu. The cucumber.js BeforeAll disables-AutoFill +
    // keychain-reset don't suppress it. autoDismissAlerts doesn't catch
    // it because it's not a UIAlertController. Dismiss it explicitly via
    // the "Not Now" button (3s wait — absent on a fast-enough machine
    // that the sheet hasn't appeared yet, but harmless when missing).
    async dismissSavePasswordSheet() {
        try {
            const btn = await this.driver.$("-ios predicate string:label == 'Not Now'");
            await btn.waitForDisplayed({ timeout: 3000 });
            await btn.click();
        } catch (e) {
            // Sheet didn't appear — fine.
        }
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
