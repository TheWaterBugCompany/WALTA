'use strict';
class BaseScreen {
    constructor( world ) {
        this.driver = world.driver;
        this.world = world;
    }


    text_selector( sel ) {
        return `//android.widget.LinearLayout[@content-desc="${sel}."]/android.widget.FrameLayout/android.widget.EditText`;
    }

    selector( sel ) {
        return `~${sel}.`;
    }

    async enter( sel, text ) {
        var el = await this.driver
            .$( this.text_selector( sel ) );
        return el.addValue(text);
    }
    async click( sel ) {
        var el = await this.driver
            .$( this.selector( sel ) );
        return el.click();
    }
}

module.exports = BaseScreen;