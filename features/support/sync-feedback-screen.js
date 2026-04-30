const BaseScreen = require('./base-screen');

class SyncFeedbackScreen extends BaseScreen {
    constructor(world) {
        super(world);
        this.presenceSelector = this.selector("Synchronise Data");
    }

    async waitForSuccess() {
        // Two syncs may run back-to-back: one fired by Topics.LOGGEDIN
        // when the deeplink login completes, plus another from the user
        // tapping Sync Now. With 2.5s delays per upload op, give the
        // second one room to finish.
        await this.waitForText("Sync complete", 120000);
    }

    async openLogs() {
        await this.click("Toggle log pane");
    }

    async expectLogsContain(text) {
        await this.waitForText(text);
    }

    async clickClose() {
        await this.click("Close sync popup");
    }
}

module.exports = SyncFeedbackScreen;
