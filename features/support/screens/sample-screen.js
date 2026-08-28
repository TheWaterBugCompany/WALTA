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

    // Training: a cell still waiting to be identified is labelled by its number;
    // tapping it opens the method chooser for that position. Training has no
    // add-to-sample plus — the number is how a taxon gets added.
    async selectCell( number ) {
        await this.click(`Cell ${number}`);
        await this.world.methodSelect.waitFor();
    }
    // SampleTaxaIcon's accessibilityLabel is
    // "Taxon <id>, <species name>, abundance <abundance>" — the bare "Taxon <id>"
    // doesn't exist as a discrete a11y element. BEGINSWITH on "Taxon <id>, "
    // disambiguates 12 from 121, 123, ...
    async clickTaxon( id ) {
        const fragment = `Taxon ${id}, `;
        await this.clickRaw( this.isIos()
            ? `-ios predicate string:label BEGINSWITH '${fragment}'`
            : `android=new UiSelector().descriptionStartsWith("${fragment}")` );
    }

    async openTaxon( id ) {
        await this.clickTaxon( id );
        await this.world.editTaxon.waitFor();
    }

    // Training: grade the tray via the Assess anchor button.
    async assess() {
        await this.click("Assess");
    }

    // Training: once graded, tapping a taxon explains it rather than editing it —
    // what the reader chose beside what the exercise expected.
    async openComparison( id ) {
        await this.clickTaxon( id );
        await this.world.taxonComparison.waitFor();
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