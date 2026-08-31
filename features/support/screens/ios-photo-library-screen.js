const BaseScreen = require('./base-screen');
const dismissPermissionAlert = require('../dismiss-permission-alert');

// Drives the real iOS photo picker presented by Ti.Media.openPhotoGallery.
// The first open shows the photo-library permission alert; we grant full
// access, then tap the first photo in the grid (single-selection picker —
// tapping returns it, no confirm button).
class IosPhotoLibraryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "-ios class chain:**/XCUIElementTypeNavigationBar[`name == 'Photos'`]";
    }

    async waitFor() {
        // The first open shows the photo-library permission alert, and the
        // out-of-process PHPicker is slow to present — ~10s even on an idle local
        // sim, well past 20s on contended CI. Pre-granting isn't reliable (see
        // docs/testing.md), so poll: tap "Allow Full Access" until the grid
        // appears — a single fixed-timeout tap misses a late alert or one whose
        // tap didn't register. The grid showing is the signal the alert is gone.
        const allowFullAccess = "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Allow Full Access'";
        await dismissPermissionAlert({
            isDone: () => this.isDisplayedRaw( this.presenceSelector ),
            tapAccept: () => this.tapIfDisplayedRaw( allowFullAccess ),
            sleep: (ms) => this.sleep(ms),
        });
        await this.waitForRaw( this.presenceSelector, "iOS photo picker grid did not appear", 5000 );
    }

    async selectFirstPhoto() {
        // The PHPicker runs out-of-process; on a contended runner a single
        // synthesized tap can be dropped (WDA reports success but the picker
        // doesn't dismiss). Tap the first cell and poll until the grid is gone,
        // re-tapping if the touch didn't register — the same reason the
        // permission alert is dismissed by polling rather than a one-shot tap.
        //
        // The budget has to fit several of those taps. One measured 12.4s on a
        // CI runner, which a 20s ceiling spent entirely on the first attempt: the
        // re-tap this loop exists for never ran, and the failure read as "the tap
        // did not work" when it meant "we only ever tried once".
        var taps = 0;
        try {
            await this.driver.waitUntil(async () => {
                if ( !( await this.isDisplayedRaw( this.presenceSelector ) ) ) return true;
                await this.tapFirstCell();
                taps++;
                return false;
            }, { timeout: 90000, interval: 1500, timeoutMsg: 'grid still up' });
        } catch (e) {
            // Say how many taps were spent: one means the budget was the problem,
            // several means the taps themselves are not landing.
            throw new Error(`iOS photo picker did not dismiss after ${taps} tap(s) over 90s`);
        }
    }

    async tapFirstCell() {
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
                // A touch that goes down and straight back up is not always read
                // as a tap; the dwell is part of the gesture, not a wait for state.
                { type: 'pause', duration: 120 },
                { type: 'pointerUp', button: 0 },
            ],
        }]);
    }
}
module.exports = IosPhotoLibraryScreen;
