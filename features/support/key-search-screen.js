const BaseScreen = require('./base-screen');

class KeySearchScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "Choose the best match";
    }

    async choose( questionText ) {
      await this.click( questionText );
    }
    
    async goBack() {
      await this.click("Back");
    }
    async goBackAndExpect(text) {
      await this.goBack();
      await this.waitForText(text);
    }

    async goMagnifyTop() {
      var el = await this.driver.$(this.selector("question_top"));
      el = await el.$(this.selector("photo_select_magnify_button"));
      await el.click();
      await this.world.gallery.waitFor();
    }

    async goMagnifyBottom() {
      var el = await this.driver.$(this.selector("question_bottom"));
      el = await el.$(this.selector("photo_select_magnify_button"));
      await el.click();
      await this.world.gallery.waitFor();
    }
 } 
module.exports = KeySearchScreen;