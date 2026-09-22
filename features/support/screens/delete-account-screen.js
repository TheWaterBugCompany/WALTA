'use strict';
const BaseScreen = require('./base-screen');

class DeleteAccountScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        // The warning label carries no accessibility label of its own — it is a
        // warning, and a screen reader should read the words — so presence is
        // detected by the field it asks the user to fill. (The buttons are no
        // good for this: WDA reports them invisible, see clickWhenPresent.)
        this.presenceSelector = this.selector("delete_account_password");
    }

    // By existence, not visibility: the screen behind this modal paints over it,
    // so WDA calls its widgets invisible — see clickWhenPresent.
    async waitForStillOpen() {
        await this.waitForExisting("delete_account_confirm");
    }

    // Through the shared field helper, which sets the value and then dismisses
    // the keyboard — it would otherwise cover the buttons below the field.
    async enterPassword( password ) {
        await this.enter("delete_account_password", password);
    }

    async confirmDelete() {
        await this.clickWhenPresent("delete_account_confirm");
    }

    async close() {
        await this.clickWhenPresent("delete_account_close");
    }
}
module.exports = DeleteAccountScreen;
