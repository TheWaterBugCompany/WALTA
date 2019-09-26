const BaseScreen = require('./base-screen');

class TaxonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Details");
    }
    async goBack() {
      await this.click("Back");
    }

    async goMagnify() {
      await this.click("Photo gallery");
      await this.world.gallery.waitFor();
    }

    async selectAddToSample() {
      await this.click("Add to sample");
      await this.world.editTaxon.waitFor()
    }
} 
module.exports = TaxonScreen;
