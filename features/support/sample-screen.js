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
    async selectEditTaxon( trayNo ) {
        // TODO
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