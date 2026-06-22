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

    // Android only: the emulator's first GPS fix reports accuracy=100m, which
    // the app rejects (gate is <100m), and it converges to a usable fix only
    // after a few seconds of listening. Opening the gallery picker pauses GPS,
    // so wait for the on-screen lock first to avoid racing convergence. iOS
    // gets a usable fix during the normal dwell, and its location label masks
    // its text behind accessibilityLabel="Location" so this poll can't read it
    // — skip there.
    async waitForLocationLock() {
        if ( this.isIos() ) return;
        await this.driver.waitUntil(async () => {
            let text = await this.getLocation();
            return text && text.includes("°");
        }, { timeout: 30000, interval: 500, timeoutMsg: "GPS lock not obtained on Site Details" });
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
        await this.click("Mayfly");
    }

    async selectQuick() {
        await this.click("Quick");
    }

    async selectDetailed() {
        await this.click("Detailed");
    }

    async selectRiver() {
        await this.click("River");
    }

    async selectWetland() {
        await this.click("Wetland");
    }

    async selectLake() {
        await this.click("Lake/Dam");
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

    async selectSitePhoto() {
        await this.click("Take Photo");
        await this.world.camera.waitFor();
    }

    async selectSitePhotoFromGallery() {
        await this.click("Choose From Gallery");
        await this.world.photoLibrary.waitFor();
    }
}
module.exports = SiteDetailsScreen;