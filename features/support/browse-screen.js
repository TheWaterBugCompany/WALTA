const BaseScreen = require('./base-screen');
class BrowseScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "Browse";
    }
    async chooseSpecies(name) {
        await this.clickByText(name);
        await world.taxon.waitFor();
    }

} 
module.exports = BrowseScreen