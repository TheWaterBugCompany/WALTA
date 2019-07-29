var { expect } = require('chai');
class BaseScreen {
    constructor( world ) {
        this.driver = world.driver;
        this.world = world;
        this.presenceSelector="unknown_base_screen"; // casues waitFor to fail
    }

    async waitForRaw(sel, message) {
        await this.driver.waitUntil( async () => {
            var el = await this.driver.$( sel );
            return await el.isDisplayed();
        }, 5000, message);
    }

    async waitFor() {
        await this.waitForRaw( this.selector(this.presenceSelector), `${this.constructor.name} not present` );
    }

    async waitForText(text) {
        await this.waitForRaw( `//android.widget.TextView[contains(@text,"${text}")]`, `text "${text}" not present`);
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