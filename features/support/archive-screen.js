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

    async getUploadedElement() {
        return this.getElement("Has Sample Been Uploaded");
    }

    async getUploaded() {
        let row = await this.getUploadedElement();
        return row.getText();
    }

    async getDateCompletedElement() {
        return this.getElement("Date Sample Completed");
    }

    async getDateCompleted() {
        let row = await this.getDateCompletedElement();
        return row.getText();
    }

    // TODO: leaving choosing from multiple rows until its needed...
    async clickRow() {
        let row = await this.getWaterbodyNameElement();
        await row.click();
        await this.world.siteDetails.waitFor();
    }
} 
module.exports = ArchiveScreen;