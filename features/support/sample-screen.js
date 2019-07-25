const BaseScreen = require('./base-screen');
class SampleScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "toolbar_sample";
    }
    async selectAddSample() {
        await this.click("sample_add");
        await this.world.methodSelect.waitFor();
    }
    async selectEditTaxon( trayNo ) {
        // TODO
    }
} 
module.exports = SampleScreen