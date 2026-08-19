const { expect } = require('chai');
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
        await this.waitForText("Synced", 120000);
    }

    async openLogs() {
        await this.click("Toggle log pane");
    }

    async expectLogsContain(text) {
        await this.waitForText(text);
    }

    async readLogText() {
        const el = await this.getElement("Log Pane");
        return await el.getText();
    }

    async firstNonEmptyLines(n, timeoutMs = 10000) {
        // Polls the pane until at least `n` non-empty lines are present.
        // The pane updates async as SampleSync emits logs through SqlSink;
        // openLogs() returning doesn't guarantee the view is populated.
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const text = await this.readLogText();
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length >= n) return lines.slice(0, n);
            await this.sleep(200);
        }
        return [];
    }

    async expectLogPaneContainsAll(lines) {
        const text = await this.readLogText();
        for (const line of lines) {
            expect(text, `expected log pane to still contain "${line}". Pane content:\n${text}`).to.include(line);
        }
    }

    async clickClose() {
        await this.click("Close sync popup");
    }
}

module.exports = SyncFeedbackScreen;
