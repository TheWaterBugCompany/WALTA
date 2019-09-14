const BaseScreen = require('./base-screen');
class AboutScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("About");
    }
} 
module.exports = AboutScreen