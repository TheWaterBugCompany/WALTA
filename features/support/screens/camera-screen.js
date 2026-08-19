const BaseScreen = require('./base-screen');

class CameraScreen extends BaseScreen {
    constructor( world ) {
        super(world);
        // Simulator builds (iOS or Android) swap the real camera for
        // Ti.UI-based Camera-test.js, which exposes a "PhotoCapture"
        // button. See plugins/unittest/1.0/hooks/unittest.js. Only on
        // real Android devices do we fall back to driving the native
        // camera package.
        if ( this.isIos() || world.isSimulator ) {
            this.presenceSelector = this.selector("PhotoCapture");
        } else {
            this.presenceSelector = `android=new UiSelector().packageNameMatches("com\.android\.camera|com\.sec\.android\.app\.camera")`;
        }
    }
    async takePhoto() {
        if ( this.isIos() || this.world.isSimulator ) {
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