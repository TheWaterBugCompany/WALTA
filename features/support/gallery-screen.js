const BaseScreen = require('./base-screen');
class GalleryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "photo_gallery";
    }
} 
module.exports = GalleryScreen