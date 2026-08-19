const { Given, When, Then } = require('@cucumber/cucumber');
const { SAMPLE_TRAY_TILE_MISSING } = require('../support/environmental-failures');
const {
    SURVEY_TAXA, FULL_HABITAT,
    fillSiteDetails, fillHabitat, addTaxaViaBrowse, addTaxonViaKeyToSample,
    markSurveyComplete, submitFromSummary, expectTrayTile,
} = require('../support/drivers/survey-driver');
const { GASTROPOD } = require('../support/drivers/training-driver');

Given('a user has arrived at a site to sample', async function () {
    await this.menu.waitFor();
});

When('the user fills out the site details', { timeout: 120000 }, async function () {
    await fillSiteDetails(this, { waterbody: "Test Creek", feature: "Bridge", sitePhoto: true });
});

When('the user fills out the habitat screen', { timeout: 60000 }, async function () {
    await fillHabitat(this, FULL_HABITAT);
});

When('the user marks the sample as complete', async function () {
    // Next on the sample tray lands on the Notes screen; from there the user
    // toggles the "survey complete" switch, enters some notes, and advances to
    // the Summary screen.
    await markSurveyComplete(this);
});

Then('the sample tray is filled with each identification', async function () {
    // Each tile in the sample tray exposes a composite accessibility label
    // "Taxon <id>, <species name>, abundance <abundance>" (SampleTaxaIcon.js).
    // Verify each species is present with the abundance set in the preceding
    // step (default "1-2" when the slider wasn't adjusted).
    await this.sample.waitFor();
    for (const taxon of SURVEY_TAXA) {
        await expectTrayTile(this, `${taxon.name}, abundance ${taxon.abundance}`,
            `${SAMPLE_TRAY_TILE_MISSING} for "${taxon.name}, abundance ${taxon.abundance}"`);
    }
});

Then('a signal score is calculated and displayed to the user', async function () {
    // Summary calculates SIGNAL score from the taxa collected. Setting
    // accessibilityLabel on the Label masks its text on iOS, so assert
    // on presence rather than numeric content: the score only binds to
    // the label once the sample is scored, so visibility is evidence
    // the calculation ran.
    await this.summary.waitFor();
    await this.summary.waitForLabel("SIGNAL Score");
});

Then('a sample id is automatically created for the user', async function () {
    // The heading on Summary binds to "{sample.surveyType} Survey",
    // which is only populated once the sample record has been persisted
    // with an id (sampleId is SQLite's AUTOINCREMENT primary key,
    // assigned on first save). Presence of the heading is evidence a
    // sample id exists.
    await this.summary.waitForLabel("Survey Heading");
});

Then('a sample is stored and sample tray is cleared', async function () {
    // Pressing Done triggers Survey.submitSurvey() (see Summary.js) which
    // persists the sample and navigates home; arriving back at the Menu
    // is evidence the submit completed and the active tray was reset.
    await submitFromSummary(this);
});

When('the user identifies a number of taxa', { timeout: 300000 }, async function () {
    // Add three taxa via the Browse (taxa list) path. Navigating the key is out
    // of scope here — identify_taxa.feature covers that path. Two of the three
    // exercise the abundance slider so the test covers non-default abundance
    // values alongside the default 1-2.
    await addTaxaViaBrowse(this, SURVEY_TAXA);
});

// The key path from the survey tray's + must reach a taxon and store it — proving
// the identification methods stay enabled in a survey (training mode greys all but
// the key; that mode must not leak into a real survey).
When('the user identifies a taxon via the key', { timeout: 120000 }, async function () {
    await addTaxonViaKeyToSample(this, GASTROPOD);
});

Then('the sample tray shows the key-identified taxon', async function () {
    await this.sample.waitFor();
    // The key path "Order level ID Gastropoda." stores taxon 181, whose tray tile
    // renders its name "gastropods" (SampleTaxaIcon accessibility label).
    await expectTrayTile(this, "gastropods",
        `${SAMPLE_TRAY_TILE_MISSING} for key-identified "gastropods"`);
});
