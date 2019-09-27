var { expect } = require('chai');
class BaseScreen {
    constructor( world ) {
        this.driver = world.driver;
        this.platform = world.platform;
        this.world = world;
        this.presenceSelector=this.selector("unknown_base_screen"); // casues waitFor to fail
    }

    isIos() { return this.platform === "ios"; }
    isAndroid() { return this.platform === "android"; }

    sleep(ms) {
        return new Promise((resolve) => setTimeout( () => resolve(), ms));
    }

    async waitForRaw(sel, message) {
        await this.driver.waitUntil( async () => {
            var el = await this.driver.$( sel );
            return await el.isDisplayed();
        }, 60000, message);
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, `${this.constructor.name} not present` );
    }

    async waitForLabel(label) {
        await this.waitForRaw( this.selector(label), `${label} not present` );
    }
 
    async waitForText(text) {
        if ( this.isIos() ) {
            await this.waitForRaw( this.selector(text), `text "${text}" not present`);
        } else {
            await this.waitForRaw( `//android.widget.TextView[contains(@text,"${text}")]`, `text "${text}" not present`);
        }
    }

    selector( sel ) {
        let res = "~"+sel;
        if ( this.isAndroid() )
            res += "."; // accessibility labels get periods
        return res;
    }

    async getElement( sel ) {
        var el = await this.driver.$( this.selector( sel ) );
        return el;
    }

    async setSliderPercent( selector, percent ) {
        var el = await this.driver.$(selector);
        var size = await el.getSize();
        var dist = size.width*percent/100;
        if ( this.isIos() ) {
            let xpos = await el.getValue();
            // $("XCUIElementTypeSlider").then( (el) => el.elementId )
            // driver.execute("mobile: dragFromToForDuration", { duration: 0.5, fromX: 11, fromY: 16, toX:40, toY: 16, element: "1B030000-0000-0000-F106-000000000000" })
            await this.driver.execute("mobile: dragFromToForDuration", {
                duration: 0.5,
                fromX: size.width*parseInt(xpos)/100,
                fromY: size.height/2,
                toX: dist,
                toY: size.height/2,
                element: el.elementId
            });
        } else {
            await el.touchAction([ 
                {action: 'press', x: 0, y: size.height/2},
                {action: 'wait',  ms: 500  },
                {action: 'moveTo', x: dist, y: size.height/2},
                'release']);
        }
    }

    async enter( sel, text ) {
        var el = await this.driver.$( this.selector( sel ) );
        if ( this.isAndroid() && el.getTagName() !== "android.widget.EditText" ) {
            el = await el.$("//android.widget.EditText");
        }
        await el.setValue(text);
        if ( this.isIos() ) {
            await this.driver.touchAction({ action: "tap", x: 0, y: 0  });
        } else {
            await this.driver.hideKeyboard();
        }
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