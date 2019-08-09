const BaseScreen = require('./base-screen');
class GalleryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "Photo Gallery";
    }

    async close() {
        await this.click("Close");
    }
} 
module.exports = GalleryScreen