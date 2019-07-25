const BaseScreen = require('./base-screen');

class CameraScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = `android=new UiSelector().packageName("com.android.camera")`;
    }
    async waitFor() {
        await this.waitForRaw( this.presenceSelector );
    }

    async takePhoto() {
        await this.clickRaw(`android=new UiSelector().resourceId("com.android.camera:id/shutter_button")`); 
        await this.clickRaw(`android=new UiSelector().resourceId("com.android.camera:id/btn_done")`);
    }
} 
module.exports = CameraScreen;