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
    async waitForBelt( name ) {
        const belt = await this.waitForExisting( name );
        return outlineShareOf( this.world.driver, belt );
    }
}
module.exports = AccountScreen;
