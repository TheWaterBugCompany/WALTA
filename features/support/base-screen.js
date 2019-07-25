var { expect } = require('chai');
class BaseScreen {
    constructor( world ) {
        this.driver = world.driver;
        this.world = world;
        this.presenceSelector="unknown_base_screen"; // casues waitFor to fail
    }

    async waitForRaw(sel) {
        var el = await this.driver.$( sel );
        var displayed = await el.isDisplayed();
        expect( displayed, `${this.constructor.name} not present` ).to.be.true;
    }

    async waitFor() {
        await this.waitForRaw( this.selector(this.presenceSelector) );
    }

    async waitForText(text) {
        var el = await this.driver.$( `//android.widget.TextView[contains(@text,"${text}")]` );
        var displayed = await el.isDisplayed();
        expect( displayed, `text "${text}" not present` ).to.be.true;
    }

    textSelector( sel ) {
        return `//android.widget.LinearLayout[@content-desc="${sel}."]/android.widget.FrameLayout/android.widget.EditText`;
    }

    selector( sel ) {
        return `~${sel}.`;
    }

    async getElement( sel ) {
        var el = await this.driver.$( this.selector( sel ) );
        return el;
    }

    async enter( sel, text ) {
        var el = await this.driver.$( this.textSelector( sel ) );
        await el.addValue(text);
    }

    async clickByText( text ) {
        await this.clickRaw(`//android.widget.TextView[contains(@text,"${text}")]`);
    }

    async clickRaw( sel ) {
        var el = await this.driver.$( sel );
        await el.click();
    }

    async click( sel ) {
        await this.clickRaw(this.selector( sel ) );
    }
}

module.exports = BaseScreen;