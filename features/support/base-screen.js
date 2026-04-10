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

    // FIXME: needs iOS version
    async getTextFromEditField(el) {
        let textElement = await el.$("//android.widget.FrameLayout/android.widget.EditText");
        return textElement.getText();
    }

    async waitForRaw(sel, message) {
        await this.driver.waitUntil( async () => {
            var el = await this.driver.$( sel );
            return await el.isDisplayed();
        }, { timeout: 60000, timeoutMsg: message });
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, `${this.constructor.name} not present` );
    }

    async waitForLabel(label) {
        await this.waitForRaw( this.selector(label), `${label} not present` );
    }
 
    async waitForText(text) {
        if ( this.isIos() ) {
            await this.waitForRaw( `-ios predicate string:name CONTAINS '${text}'`, `text "${text}" not present`);
        } else {
            await this.waitForRaw( `//android.widget.TextView[contains(@text,"${text}")]`, `text "${text}" not present`);
        }
    }

    selector( sel ) {
        // Titanium appends a period to accessibility identifiers on both platforms
        return "~" + sel + ".";
    }

    async getElement( sel ) {
        var el = await this.driver.$( this.selector( sel ) );
        return el;
    }

    async setSliderPercent( selector, percent ) {
        var el = await this.driver.$(selector);
        var size = await el.getSize();
        var location = await el.getLocation();
        var dist = Math.round(size.width * percent / 100);
        if ( this.isIos() ) {
            let xpos = await el.getValue();
            await this.driver.execute("mobile: dragFromToForDuration", {
                duration: 0.5,
                fromX: size.width * parseInt(xpos) / 100,
                fromY: size.height / 2,
                toX: dist,
                toY: size.height / 2,
                element: el.elementId
            });
        } else {
            await this.driver.performActions([{
                type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: location.x, y: Math.round(location.y + size.height / 2) },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: 500 },
                    { type: 'pointerMove', duration: 300, x: location.x + dist, y: Math.round(location.y + size.height / 2) },
                    { type: 'pointerUp', button: 0 },
                ],
            }]);
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
            await this.clickRaw(`-ios predicate string:label CONTAINS '${text}'`);
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