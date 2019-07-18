'use strict';
class BaseScreen {
    constructor( world ) {
        this.driver = world.driver;
        this.world = world;
        this.presenceSelector="unknown_base_screen"; // casues waitFor to fail
    }

    async waitFor() {
        await this.driver.$( this.selector(this.presenceSelector) );
    }

    async waitForText(text) {
        await this.driver.$( `//android.widget.TextView[@text="${text}"]` );

    }

    textSelector( sel ) {
        return `//android.widget.LinearLayout[@content-desc="${sel}."]/android.widget.FrameLayout/android.widget.EditText`;
    }

    selector( sel ) {
        return `~${sel}.`;
    }

    async enter( sel, text ) {
        var el = await this.driver
            .$( this.textSelector( sel ) );
        return el.addValue(text);
    }
    async click( sel ) {
        var el = await this.driver
            .$( this.selector( sel ) );
        return el.click();
    }
}

module.exports = BaseScreen;