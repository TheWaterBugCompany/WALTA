const BaseScreen = require('./base-screen');

// Drives the real Android system photo picker (com.google.android.photopicker)
// presented by Ti.Media.openPhotoGallery. It's a Compose UI with no resource
// ids; photo thumbnails expose a "Photo taken on <date>" content-description.
class AndroidPhotoLibraryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = 'android=new UiSelector().descriptionContains("Photo taken on")';
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, "Android photo picker did not appear", 20000 );
    }

    async selectFirstPhoto() {
        var photo = await this.driver.$(this.presenceSelector);
        await photo.waitForDisplayed({ timeout: 20000, timeoutMsg: "no photo in Android picker to select" });
        await photo.click();
        // Single-select returns on tap, but if the picker is in multi-select
        // mode it stays open with a Done confirm — tap it when present.
        try {
            var done = await this.driver.$('android=new UiSelector().text("Done")');
            if ( await done.isDisplayed() ) await done.click();
        } catch (e) { /* single-select picker already returned */ }
    }
}
module.exports = AndroidPhotoLibraryScreen;
