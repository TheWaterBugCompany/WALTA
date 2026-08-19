'use strict';

const BaseScreen = require('./base-screen');

class LoginScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector('login_login_button');
    }
    async login( email, password ) {
        await this.enter('login_email_textfield', email );
        await this.enter('login_password_textfield', password );
        await this.click('login_login_button');
        if (this.isIos()) await this.dismissSavePasswordSheet();
    }

    // iOS's system "Save Password?" sheet persists across walta://reset (it's
    // a system overlay, not a UIAlertController). Dismiss it deterministically;
    // throw if it never appears — a silent return leaked it into later scenarios.
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
