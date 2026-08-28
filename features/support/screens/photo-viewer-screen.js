'use strict';
const BaseScreen = require('./base-screen');

// Zooming a photo the reader is looking at — their own, or a taxon's from the
// key screen. Presents like the Gallery but is a different screen: nothing here
// leads into the key.
class PhotoViewerScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Photo 1");
    }

    async close() {
        await this.click("Close");
    }
}
module.exports = PhotoViewerScreen;
