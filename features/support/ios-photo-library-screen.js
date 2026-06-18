const BaseScreen = require('./base-screen');

// Drives the real iOS photo picker presented by Ti.Media.openPhotoGallery.
// The first open shows the photo-library permission alert; we grant full
// access, then tap the first photo in the grid (single-selection picker —
// tapping returns it, no confirm button).
class IosPhotoLibraryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "-ios class chain:**/XCUIElementTypeNavigationBar[`name == 'Photos'`]";
    }

    async dismissPermissionAlertIfPresent() {
        try {
            var allow = await this.driver.$("-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Allow Full Access'");
            await allow.waitForDisplayed({ timeout: 8000 });
            await allow.click();
        } catch (e) { /* already granted on a prior open — no alert */ }
    }

    async waitFor() {
        await this.dismissPermissionAlertIfPresent();
        await this.waitForRaw( this.presenceSelector, "iOS photo picker grid did not appear", 20000 );
    }

    async selectFirstPhoto() {
        // Grid cells report visible=false but are accessible; tap the first
        // one's centre by coordinates rather than .click() (not "hittable").
        var photo = await this.driver.$("-ios class chain:**/XCUIElementTypeImage[`name == 'PXGGridLayout-Info'`][1]");
        var loc = await photo.getLocation();
        var size = await photo.getSize();
        await this.driver.performActions([{
            type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
            actions: [
                { type: 'pointerMove', duration: 0, x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 2) },
                { type: 'pointerDown', button: 0 },
                { type: 'pointerUp', button: 0 },
            ],
        }]);
    }
}
module.exports = IosPhotoLibraryScreen;
