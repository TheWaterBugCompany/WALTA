'use strict';
const BaseScreen = require('./base-screen');

class AcademyScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        // Presence-detect by a line unique to the modal — the menu behind the
        // overlay also carries an "Academy" label.
        this.presenceSelector = this.selector("academy_current_belt");
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
