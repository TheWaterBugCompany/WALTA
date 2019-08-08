const BaseScreen = require('./base-screen');

class TaxonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "Details";
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
      await this.world.sample.waitFor();
    }
} 
module.exports = TaxonScreen;
