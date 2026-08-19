const BaseScreen = require('./base-screen');
class HelpScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Help");
    }
} 
module.exports = HelpScreen