const BaseScreen = require('./base-screen');

class KeySearchScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "keysearch_choose_best_match";
    }

    async choose( questionText ) {
      await this.clickByText( questionText );
    }
    async chooseTop() {
      await this.click("question_top");
    }
    async chooseTopAndExpect(text) {
      await this.chooseTop();
      await this.waitForText(text);
    }
    async chooseBottom() {
      await this.click("question_bottom");
    }
    async chooseBottomAndExpect(text) {
      await this.chooseBottom();
      await this.waitForText(text);
    }
    async goBack() {
      await this.click("go_back_button");
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