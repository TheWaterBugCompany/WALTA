const BaseScreen = require('./base-screen');
class SiteDetailsScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "Site Details";
    }

    async selectMayfly() {
        await this.clickByText("Mayfly");
    }

    async selectQuick() {
        await this.clickByText("Quick");
    }

    async selectDetailed() {
        await this.clickByText("Detailed");
    }

    async selectRiver() {
        await this.clickByText("River");
    }

    async selectWetland() {
        await this.clickByText("Wetland");
    }

    async selectLake() {
        await this.clickByText("Lake/Dam");
    }

    async setWaterbodyName( text ) {
        await this.enter( "Waterbody Name", text );
    }

    async setNearByFeature( text ) {
        await this.enter( "Near By Feature", text );
    }

    async goNext() {
        await this.click( "Next" );
        await this.world.habitat.waitFor();
    }
} 
module.exports = SiteDetailsScreen;