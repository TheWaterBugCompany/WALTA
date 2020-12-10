const BaseScreen = require('./base-screen');
class ArchiveScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Survey History");
    }

    async getWaterbodyNameElement() {
        return this.getElement("Waterbody Name");
    }

    async getWaterbodyName() {
        let row = await this.getWaterbodyNameElement();
        return row.getText();
    }

    // TODO: leaving choosing from multiple rows until its needed...
    async clickRow() {
        let row = await this.getWaterbodyNameElement();
        return row.click();
    }
} 
module.exports = ArchiveScreen;