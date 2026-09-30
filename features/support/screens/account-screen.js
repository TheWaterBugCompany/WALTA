'use strict';
const BaseScreen = require('./base-screen');
const { outlineShareOf, OUTLINE_DRAWN } = require('../outline-share');

class AccountScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("account_belts_heading");
    }

    // A belt is drawn as two coloured views, so its accessibility label is what
    // names it. Being in the tree is not enough to know it was drawn, though —
    // the outline says whether it was really painted there.
    async chooseDeleteAccount() {
        await this.click("account_delete");
    }

    // The Ti confirm is a native dialog — it belongs to no screen's view tree,
    // and WDA's acceptAlert leaves it standing. Tap its button by label and
    // watch for the menu behind it, re-tapping if the tap did not land.
    async confirmLogOut() {
        const logOut = this.isIos()
            ? "-ios predicate string:type == 'XCUIElementTypeButton' AND label == 'Log Out'"
            : 'android=new UiSelector().text("Log Out")';
        await this.clickUntil( logOut, () => this.world.menu.isPresent() );
    }

    async waitForBelt( name ) {
        const belt = await this.waitForExisting( name );
        return outlineShareOf( this.world.driver, belt );
    }
}
module.exports = AccountScreen;
