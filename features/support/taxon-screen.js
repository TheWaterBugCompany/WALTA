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

    // Training has no per-taxon editor: adding drops the taxon straight into the
    // tray, so wait for the tray rather than the EditTaxon overlay. The detail
    // window slides in, so tap the button only once it is stationary.
    async addToTrainingSample() {
      await this.clickWhenStable( this.selector("Add to sample") );
      await this.world.sample.waitFor();
    }
}
module.exports = TaxonScreen;
