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
        // Between Sample tray and Summary there's a Notes screen
        // (partial-submission toggle + survey notes). The caller is
        // responsible for completing it via NotesScreen.goNext().
        await this.world.notes.waitFor();
    }

    async goBack() {
        await this.click("Back");
        await this.world.habitat.waitFor();
    }
} 
module.exports = SampleScreen