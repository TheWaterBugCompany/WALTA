
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I have already completed a sample', function () {
    return this.menu.login( "test", "password" )

});

Then('I can add or remove new species', function () {
    return 'pending';
});


When('I activate the sample edit mode', function () {
    return 'pending';
});


// Editing a completed sample: reopen it from history in Edit mode and walk forward
// to the Summary, which must render the edited sample (not blank) — WB-243.
When('I edit the stored sample from history', async function () {
    await this.menu.selectArchive();
    await this.archive.clickRow();
    await this.sampleEditMenu.selectEdit();
});

When('I move forward to the summary screen', { timeout: 120000 }, async function () {
    await this.siteDetails.waitForLocationLock();
    await this.siteDetails.goNext();
    await this.habitat.goNext();
    await this.sample.goNext();
    await this.notes.goNext();
    await this.summary.waitFor();
});

Then('the summary shows the survey site and signal score', async function () {
    await this.summary.waitFor();
    // siteInfo has no accessibility label, so its text is readable — evidence the
    // summary rendered the sample rather than a blank singleton.
    await this.summary.waitForText("Test Creek @ Bridge");
    await this.summary.waitForLabel("SIGNAL Score");
});
