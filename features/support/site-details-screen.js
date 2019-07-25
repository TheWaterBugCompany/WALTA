const BaseScreen = require('./base-screen');
class SiteDetailsScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "toolbar_site_details";
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
        await this.enter( "site_details_waterbody_name", text );
    }

    async setNearByFeature( text ) {
        await this.enter( "site_details_near_by_feature", text );
    }

    async goNext() {
        await this.click( "site_details_next" );
        await this.world.habitat.waitFor();
    }
} 
module.exports = SiteDetailsScreen;