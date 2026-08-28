const BaseScreen = require('./base-screen');

class KeySearchScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Choose the best match");
    }

    async choose( questionText ) {
      // The decision window slides in; tap only once the option is stationary.
      await this.clickByTextWhenStable( questionText );
    }
    
    async goBack() {
      await this.click("Back");
    }

    // Whether the named anchor-bar shortcut (e.g. "Speedbug", "Browse") is on the
    // key screen — used to prove training hides the shortcuts that would slip past
    // the greyed Method Select.
    async shortcutPresent( label ) {
      return await (await this.driver.$( this.selector( label ) )).isExisting();
    }
    async goBackAndExpect(text) {
      await this.goBack();
      await this.waitForText(text);
    }

    async goMagnifyTop() {
      var el = await this.driver.$(this.selector("Magnify"));
      await el.click();
      await this.world.photoViewer.waitFor();
    }

    async goMagnifyBottom() {
      var el = await this.driver.$(this.selector("Magnify"));
      await el.click();
      await this.world.photoViewer.waitFor();
    }
 } 
module.exports = KeySearchScreen;