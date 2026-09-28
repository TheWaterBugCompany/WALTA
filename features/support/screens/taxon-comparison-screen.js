'use strict';
const BaseScreen = require('./base-screen');

// The modal a graded taxon opens: what the reader chose beside what the exercise
// expected, and the way back into the key for a wrong answer.
class TaxonComparisonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("taxon_comparison_message");
    }

    // Each photo card is labelled with its taxon's name, and tapping one browses
    // out to that taxon rather than staying on the feedback.
    async openTaxon( name ) {
        await this.clickWhenStable( this.selector( name ) );
    }

    // The two variants differ in how many taxa they draw: a right answer shows
    // the one taxon, a wrong one shows the chosen taxon beside the expected one.
    // The heading would say so in words, but its accessibilityLabel is what the
    // a11y tree reports for that label, so the message text is not readable from
    // here — the cards are.
    async cardsFor( name ) {
        const cards = await this.driver.$$( this.selector( name ) );
        return cards.length;
    }

    // "Which question did I get wrong?" — the modal dismisses itself and the key
    // reopens at the couplet the two taxa part at.
    async whichQuestion() {
        await this.click("taxon_comparison_action");
        await this.world.keySearch.waitFor();
    }
}
module.exports = TaxonComparisonScreen;
