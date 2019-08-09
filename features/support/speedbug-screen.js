const BaseScreen = require('./base-screen');
class SpeedbugScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "Speedbug";
    }
    async chooseSpeedbug( refId ) {
        await this.click( `Speedbug ${refId}` );
        await this.world.taxon.waitFor();
    }
    async chooseNotSure( refId ) {
        await this.click( `Not Sure ${refId}` );
        await this.world.keySearch.waitFor();
    }
} 
module.exports = SpeedbugScreen