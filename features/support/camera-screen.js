const BaseScreen = require('./base-screen');

class CameraScreen extends BaseScreen {
    constructor( world ) {
        super(world);
        if ( this.isIos() ) {
            // iOS simulator can't drive Ti.Media.showCamera's native picker
            // (UIImagePickerController runs in a separate system process that
            // doesn't accept synthesized taps, and newer sim models have no
            // camera simulation at all). Simulator builds swap in a Ti.UI-based
            // test camera (lib/ui/Camera-test.js) with a "PhotoCapture" button
            // we can actually tap — see plugins/unittest/1.0/hooks/unittest.js.
            this.presenceSelector = this.selector("PhotoCapture");
        } else {
            this.presenceSelector = `android=new UiSelector().packageNameMatches("com\.android\.camera|com\.sec\.android\.app\.camera")`;
        }
    }
    async takePhoto() {
        if ( this.isIos() ) {
            await this.click("PhotoCapture");
        } else {
            let packageName = await this.driver.getCurrentPackage();
            if ( packageName === "com.sec.android.app.camera") {
                // yuck there isn't an accesssbility label or even button because the UI is in OpenGL
                // this is fragile and will break but for now its OK.
                await this.driver.touchAction([{action: 'tap', x: 1797, y: 545 }]);
                //await this.driver.debug();
                await this.waitForRaw( `android=new UiSelector().resourceId("com.sec.android.app.camera:id/okay")`, "waiting for photo to be taken" )
                await this.clickRaw( `android=new UiSelector().resourceId("com.sec.android.app.camera:id/okay")`);

            } else {
                await this.clickRaw(`android=new UiSelector().resourceId("com.android.camera:id/shutter_button")`); 
                await this.clickRaw(`android=new UiSelector().resourceId("com.android.camera:id/btn_done")`);
            }
        }
    }
}
module.exports = CameraScreen;