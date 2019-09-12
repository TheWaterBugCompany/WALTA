const BaseScreen = require('./base-screen');

class KeySearchScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Choose the best match");
    }

    async choose( questionText ) {
      await this.clickByText( questionText );
    }
    
    async goBack() {
      await this.click("Back");
    }
    async goBackAndExpect(text) {
      await this.goBack();
      await this.waitForText(text);
    }

    async goMagnifyTop() {
      var el = await this.driver.$(this.selector("Magnify"));
      await el.click();
      await this.world.gallery.waitFor();
    }

    async goMagnifyBottom() {
      var el = await this.driver.$(this.selector("Magnify"));
      await el.click();
      await this.world.gallery.waitFor();
    }
 } 
module.exports = KeySearchScreen;