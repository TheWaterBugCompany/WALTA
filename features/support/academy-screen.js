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
        await this.enter("academy_code_1", digits[0]);
        await this.enter("academy_code_2", digits[1]);
        await this.enter("academy_code_3", digits[2]);
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
