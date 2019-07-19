const BaseScreen = require('./base-screen');
class BrowseScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "toolbar_browse";
    }
    async chooseSpecies(name) {
        await this.clickByText(name);
    }
    async chooseSpeciesAndExpect(name, text) {
      await this.chooseSpecies(name);
      await this.waitForText(text);

  }
} 
module.exports = BrowseScreen