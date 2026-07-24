'use strict';
const BaseScreen = require('./base-screen');

class AcademyScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        // Presence-detect by a box unique to the modal — the menu behind the
        // overlay also carries an "Academy" label.
        this.presenceSelector = this.selector("academy_code_1");
    }

    async enterCode( code ) {
        const digits = String(code).split("");
        for ( let i = 0; i < digits.length; i++ ) {
            // Tapping a box opens the digit picker; tap the digit to fill it.
            await this.click("academy_code_" + (i + 1));
            await this.click("academy_key_" + digits[i]);
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
