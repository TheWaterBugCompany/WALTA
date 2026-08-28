'use strict';
const BaseScreen = require('./base-screen');

// The modal a graded taxon opens: what the reader chose beside what the exercise
// expected, and the way back into the key for a wrong answer.
class TaxonComparisonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("taxon_comparison_message");
    }

    // "Which question did I get wrong?" — the modal dismisses itself and the key
    // reopens at the couplet the two taxa part at.
    async whichQuestion() {
        await this.click("taxon_comparison_action");
        await this.world.keySearch.waitFor();
    }
}
module.exports = TaxonComparisonScreen;
