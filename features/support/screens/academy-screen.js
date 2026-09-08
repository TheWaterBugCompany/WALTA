'use strict';
const BaseScreen = require('./base-screen');

class AcademyScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        // Presence-detect by a box unique to the modal — the menu behind the
        // overlay also carries an "Academy" label.
        this.presenceSelector = this.selector("academy_code_1");
    }

    // Typed the way a user types it: tap the first box, then send the digits.
    // The screen moves the keyboard between boxes itself, so setting each box
    // in turn fights that — the driver clears and re-focuses a box the screen
    // has already moved on from.
    async enterCode( code ) {
        await this.click("academy_code_1");
        for ( const digit of String(code) ) {
            await this.driver.keys( digit );
        }
    }

    async waitForStartAvailable() {
        await this.waitForLabel("academy_start");
    }

    async start() {
        await this.click("academy_start");
    }

    async close() {
        await this.click("academy_close");
    }
}
module.exports = AcademyScreen;
