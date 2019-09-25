const BaseScreen = require('./base-screen');
class SummaryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Summary");
    }

    async goBack() {
        await this.click("Back");
        await this.world.sample.waitFor();
    }
} 
module.exports = SummaryScreen