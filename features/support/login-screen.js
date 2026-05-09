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
    // submits. It persists across app terminations and walta://reset
    // because it's a system overlay, not a UIAlertController — neither the
    // BeforeAll AutoFill/keychain reset nor autoDismissAlerts suppress it.
    // Tapping "Not Now" makes iOS not re-present the sheet for that
    // credential, so dismissing it once deterministically here keeps it
    // out of every subsequent scenario.
    //
    // Three steps, all required:
    //   1. Wait for the sheet to appear — generous timeout because on
    //      contended macOS-15 runners it can take >10s to render.
    //   2. Tap "Not Now".
    //   3. Wait for the sheet to actually animate away — otherwise the
    //      next step races the dismiss animation and finds the sheet
    //      still occluding the menu.
    async dismissSavePasswordSheet() {
        const btn = await this.driver.$("-ios predicate string:label == 'Not Now'");
        try {
            await btn.waitForDisplayed({ timeout: 20000 });
        } catch (e) {
            return; // sheet never appeared — nothing to dismiss
        }
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
