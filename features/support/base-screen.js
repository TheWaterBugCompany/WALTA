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
        var cy = Math.round(location.y + size.height / 2);
        // iOS slider value at min sits at the left edge; start a few px in
        // to land on the thumb, then drag to the target offset. Use W3C
        // actions with an explicit pause — `mobile: dragFromToForDuration`
        // doesn't reliably fire the Titanium slider's change event on sim.
        var fromX = this.isIos() ? location.x + 10 : location.x;
        await this.driver.performActions([{
            type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
            actions: [
                { type: 'pointerMove', duration: 0, x: fromX, y: cy },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 500 },
                { type: 'pointerMove', duration: 500, x: location.x + dist, y: cy },
                { type: 'pointerUp', button: 0 },
            ],
        }]);
    }

    async enter( sel, text ) {
        var el = await this.driver.$( this.selector( sel ) );
        if ( this.isAndroid() && el.getTagName() !== "android.widget.EditText" ) {
            el = await el.$("//android.widget.EditText");
        }
        await el.setValue(text);
        if ( this.isIos() ) {
            // Titanium text fields don't expose a standard keyboard dismiss
            // button, so hideKeyboard() fails. Tap above the keyboard to
            // blur the text field and dismiss it.
            var size = await this.driver.getWindowSize();
            await this.driver.performActions([{
                type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: Math.round(size.width / 2), y: 20 },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerUp', button: 0 },
                ],
            }]);
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
        await el.waitForDisplayed({ timeout: 10000 });
        await el.click();
    }

    async click( sel ) {
        await this.clickRaw(this.selector( sel ) );
    }
}

module.exports = BaseScreen;