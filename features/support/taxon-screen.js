const BaseScreen = require('./base-screen');

class TaxonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "taxon_heading_text";
    }
    async getHeading() {
        var el = await this.getElement("taxon_heading_text");
        return el.getText();
    }
    async goBack() {
      await this.click("go_back_button");
    }

    async goMagnify() {
      await this.click("photo_select_magnify_button");
      await this.world.gallery.waitFor();
    }

    async selectAddToSample() {
      await this.click("icon_add_to_sample");
      await this.world.sample.waitFor();
    }
} 
module.exports = TaxonScreen;
