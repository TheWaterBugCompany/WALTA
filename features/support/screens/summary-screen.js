const BaseScreen = require('./base-screen');
class SummaryScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Summary");
    }

    async goBack() {
        await this.click("Back");
        await this.world.sample.waitFor();
    }

    async submit() {
        await this.click("submit");
        await this.world.menu.waitFor();
    }

    async getSignalScore() {
        // With accessibilityLabel set, iOS exposes the display text via
        // the `value` attribute (name/label return the accessibility
        // label). `getValue()` in wdio doesn't map to this — use
        // `getAttribute('value')` directly.
        var el = await this.driver.$(this.selector("SIGNAL Score"));
        await el.waitForDisplayed({ timeout: 10000 });
        if ( this.isIos() ) {
            return await el.getAttribute("value");
        }
        return await el.getText();
    }

    async goDone() {
        // Done triggers submitSurvey() then routes to Menu when logged
        // in, LogIn otherwise (see Summary.js doneClick). Wait for the
        // Summary screen to disappear rather than guessing which.
        await this.click("Done");
        await this.driver.waitUntil(async () => {
            var el = await this.driver.$(this.presenceSelector);
            return !(await el.isDisplayed());
        }, { timeout: 30000, timeoutMsg: "Summary screen didn't close after Done" });
    }
}
module.exports = SummaryScreen