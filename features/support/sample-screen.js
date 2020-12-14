const BaseScreen = require('./base-screen');
class SampleScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Sample");
    }
    async selectAddSample() {
        await this.click("Add Sample");
        await this.world.methodSelect.waitFor();
    }
    async openTaxon( id ) {
        await this.click(`Taxon ${id}`);
        await this.world.editTaxon.waitFor();
    }

    async goNext() {
        await this.click("Next");
        await this.world.summary.waitFor();
    }

    async goBack() {
        await this.click("Back");
        await this.world.habitat.waitFor();
    }
} 
module.exports = SampleScreen