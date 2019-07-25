const BaseScreen = require('./base-screen');
class SpeedbugScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "toolbar_speedbug";
    }
    async chooseSpeedbug( refId ) {
        await this.click( `speedbug_${refId}` );
        await this.world.taxon.waitFor();
    }
    async chooseNotSure( refId ) {
        await this.click( `speedbug_not_sure_${refId}` );
        await this.world.keySearch.waitFor();
    }
} 
module.exports = SpeedbugScreen