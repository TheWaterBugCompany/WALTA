const BaseScreen = require('./base-screen');

class PhotoSelectScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "photo_select";
    }
    async selectCamera() {
        await this.click("photo_select_camera_button"); 
        await this.world.camera.waitFor();
    }
} 
module.exports = PhotoSelectScreen;