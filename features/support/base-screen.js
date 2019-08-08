var { expect } = require('chai');
class BaseScreen {
    constructor( world ) {
        this.driver = world.driver;
        this.platform = world.platform;
        this.world = world;
        this.presenceSelector="unknown_base_screen"; // casues waitFor to fail
    }

    isIos() { return this.platform === "ios"; }
    isAndroid() { return this.platform === "android"; }

    async waitForRaw(sel, message) {
        await this.driver.waitUntil( async () => {
            var el = await this.driver.$( sel );
            return await el.isDisplayed();
        }, 50000, message);
    }

    async waitFor() {
        await this.waitForRaw( this.selector(this.presenceSelector), `${this.constructor.name} not present` );
    }

    async waitForText(text) {
        if ( this.isIos() ) {
            await this.waitForRaw( this.selector(text), `text "${text}" not present`);
        } else {
            await this.waitForRaw( `//android.widget.TextView[contains(@text,"${text}")]`, `text "${text}" not present`);
        }
    }

    textSelector( sel ) {
        return `//*[@content-desc="${sel}."]/android.widget.FrameLayout/android.widget.EditText`;
    }

    selector( sel ) {
        let res = "~"+sel;
        if ( this.isAndroid() )
            res += res + "."; // accessibility labels get periods
        return res;
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
        if ( this.isIos() ) {
            await this.click(text);
        } else {
            await this.clickRaw(`//android.widget.TextView[contains(@text,"${text}")]`);
        }
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