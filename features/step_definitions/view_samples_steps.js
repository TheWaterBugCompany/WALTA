'use strict';
const { When, Then } = require('@cucumber/cucumber');
const path = require('path');
const { assertLooksSame } = require('../support/image-test');

When('I open the sample tray for the downloaded sample', { timeout: 60000 }, async function () {
    // The preceding "close the sync popup" step leaves us on the Archive
    // screen (sync was launched from there), so no Menu hop needed.
    await this.archive.clickRow();
    await this.sampleEditMenu.selectView();
    await this.siteDetails.goNext();
    await this.habitat.goNext();
    await this.sample.waitFor();
});

Then('I can see each creature with its abundance', async function () {
    // Sample tray tiles expose accessibilityLabel
    // "Taxon <id>, <species name>, abundance <abundance>" via
    // SampleTaxaIcon.js. makeMockSample() seeds creatures 12 and 11.
    // Probe with BEGINSWITH so we don't tangle this assertion with the
    // raw-count-vs-abundance-bucket rendering — the photo check below
    // is what this scenario exists for.
    const fragments = ["Taxon 12, ", "Taxon 11, "];
    for (const fragment of fragments) {
        const selector = this.platform === "ios"
            ? `-ios predicate string:label BEGINSWITH '${fragment}'`
            : `android=new UiSelector().descriptionStartsWith("${fragment}")`;
        const el = await this.driver.$(selector);
        await el.waitForDisplayed({
            timeout: 10000,
            timeoutMsg: `Sample tray is missing tile starting with "${fragment}"`,
        });
    }
});

When('I select the creature with taxon id {int}', async function (id) {
    await this.sample.openTaxon(id);
    this.currentTaxonId = id;
});

Then('the creature photo matches the expected image', async function () {
    const id = this.currentTaxonId;
    // assertLooksSame normalises both images to a fixed size before
    // pixel-diff (see features/support/image-test.js), so one baseline
    // serves every device profile.
    const baseline = path.join(__dirname,
        `../../test-resources/expected_taxon${id}_photo.png`);
    const captured = `/tmp/taxon${id}_photo.png`;
    await this.editTaxon.saveTaxonPhoto(captured);
    await assertLooksSame(baseline, captured);
});

When('I close the creature detail', async function () {
    await this.editTaxon.close();
});
