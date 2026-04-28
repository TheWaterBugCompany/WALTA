const BaseScreen = require('./base-screen');

class SyncFeedbackScreen extends BaseScreen {
    constructor(world) {
        super(world);
        this.presenceSelector = this.selector("Synchronise Data");
    }

    async waitForSuccess() {
        await this.waitForText("Sync complete");
    }

    async clickClose() {
        await this.click("Close sync popup");
    }
}

module.exports = SyncFeedbackScreen;
