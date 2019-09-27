const BaseScreen = require('./base-screen');

class CameraScreen extends BaseScreen {
    constructor( world ) {
        super(world);
        if ( this.isIos() ) {
            this.presenceSelector = this.selector("Viewfinder");
        } else {
            this.presenceSelector = `android=new UiSelector().packageNameMatches("com\.android\.camera|")`;
        }
    }
    async takePhoto() {
        if ( this.isIos() ) {
            await this.click("Take Picture");
            await this.click("Use Photo");
        } else {
            await this.clickRaw(`android=new UiSelector().resourceId("com.android.camera:id/shutter_button")`); 
            await this.clickRaw(`android=new UiSelector().resourceId("com.android.camera:id/btn_done")`);
        }
    }
}
module.exports = CameraScreen;