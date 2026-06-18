const BaseScreen = require('./base-screen');

// Drives the real Android photo picker presented by Ti.Media.openPhotoGallery.
// Modern Android shows the system photo picker (PickVisualMedia); we pick the
// first photo thumbnail.
class AndroidPhotoLibraryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = 'android=new UiSelector().resourceIdMatches(".*:id/(icon_thumbnail|thumbnail|image)")';
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, "Android photo picker did not appear" );
    }

    async selectFirstPhoto() {
        var photo = await this.driver.$(this.presenceSelector);
        await photo.waitForDisplayed({ timeout: 30000, timeoutMsg: "no photo in Android picker to select" });
        await photo.click();
    }
}
module.exports = AndroidPhotoLibraryScreen;
