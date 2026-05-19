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
        // SampleTaxaIcon's accessibilityLabel is
        // "Taxon <id>, <species name>, abundance <abundance>" — the
        // bare "Taxon <id>" id doesn't exist as a discrete a11y element.
        // BEGINSWITH on "Taxon <id>, " disambiguates 12 from 121, 123, ...
        const fragment = `Taxon ${id}, `;
        const selector = this.isIos()
            ? `-ios predicate string:label BEGINSWITH '${fragment}'`
            : `android=new UiSelector().descriptionStartsWith("${fragment}")`;
        await this.clickRaw(selector);
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