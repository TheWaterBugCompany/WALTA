const BaseScreen = require('./base-screen');
class GalleryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Photo 1");
    }

    async close() {
        await this.click("Close");
    }
} 
module.exports = GalleryScreen