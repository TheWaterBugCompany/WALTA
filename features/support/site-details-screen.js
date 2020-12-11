const BaseScreen = require('./base-screen');

class SiteDetailsScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Site Details");
    }

    

    async getWaterbodyNameElement() {
        return this.getElement("Waterbody Name");
    }

    async getWaterbodyName() {
        let row = await this.getWaterbodyNameElement();
        return this.getTextFromEditField(row);
    }

    async getNearbyFeatureElement() {
        return this.getElement("Near By Feature");
    }

    async getNearbyFeature() {
        let row = await this.getNearbyFeatureElement();
        return this.getTextFromEditField(row);
    }

    async getSurveyLevelElement() {
        return this.getElement("Survey Level");
    }

    async getLocationElement() {
        return this.getElement("Location");
    }

    async getLocation() {
        let el = await this.getLocationElement();
        return el.getText();
    }

    async getWaterbodyTypeElement() {
        return this.getElement("Waterbody Type");
    }

    async getSelectedValue(el) {
        // FIXME: needs alternate code for iOS
        let buttonCtn=await el.$("//android.view.ViewGroup/android.view.ViewGroup");
        let text = await buttonCtn.getAttribute("content-desc");
        return text.slice(0,-1);
    }

    async getSurveyLevel() {
        let el = await this.getSurveyLevelElement()
        return this.getSelectedValue( el );
    }

    async getWaterbodyType() {
        let el = await this.getWaterbodyTypeElement()
        return this.getSelectedValue( el );
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

    async goBack() {
        await this.click("Back");
        await this.world.menu.waitFor();
    }

    async saveSitePhoto(filePath) {
        let sitePhoto = await this.getElement("Photo");
        await sitePhoto.saveScreenshot(filePath);
    }
} 
module.exports = SiteDetailsScreen;