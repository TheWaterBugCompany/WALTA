'use strict';
const BaseScreen = require('./base-screen');

class SampleEditMenuScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        // SampleEditMenu.xml's title Label has accessibilityLabel="Select
        // Option" but empty text — iOS doesn't surface accessibility from
        // invisible Labels, so the `~Select Option.` selector finds
        // nothing. Anchor on the visible View button text instead, which
        // is always present whenever the modal is up.
    }

    async waitFor() {
        await this.waitForText("View selected survey.");
    }

    // MenuButton sets accessibilityLabel from `title`, which is null here
    // (see SampleEditMenu.js) — buttons have no accessibility id. Click
    // by visible description text instead.
    async selectView() {
        await this.clickByText("View selected survey.");
        await this.world.siteDetails.waitFor();
    }

    async selectEdit() {
        await this.clickByText("Edit selected survey.");
        await this.world.siteDetails.waitFor();
    }
}
module.exports = SampleEditMenuScreen;
