const { Given, When, Then } = require('@cucumber/cucumber');
const { SAMPLE_TRAY_TILE_MISSING } = require('../support/environmental-failures');

Given('a user has arrived at a site to sample', async function () {
    await this.menu.waitFor();
});

When('the user fills out the site details', { timeout: 120000 }, async function () {
    await this.menu.selectWaterbugSurvey();
    await this.siteDetails.selectDetailed();
    await this.siteDetails.selectRiver();
    await this.siteDetails.setWaterbodyName("Test Creek");
    await this.siteDetails.setNearByFeature("Bridge");
    // Opening the camera pauses GPS; wait for the fix first so Done isn't left
    // disabled when the emulator hasn't converged below the 100m gate yet.
    await this.siteDetails.waitForLocationLock();
    await this.siteDetails.selectSitePhoto();
    await this.camera.takePhoto();
    await this.siteDetails.goNext();
});

When('the user fills out the habitat screen', { timeout: 60000 }, async function () {
    // Habitat values must sum to 100% or the Next button stays disabled.
    await this.habitat.setLeafPacks("20");
    await this.habitat.setAquaticPlants("10");
    await this.habitat.setWood("10");
    await this.habitat.setEdgePlants("10");
    await this.habitat.setBoulders("10");
    await this.habitat.setGravel("10");
    await this.habitat.setSandOrSilt("20");
    await this.habitat.setOpenWater("10");
    await this.habitat.goNext();
});

When('the user marks the sample as complete', async function () {
    // Next on the sample tray lands on the Notes screen; from there the
    // user toggles the "survey complete" switch, enters some notes, and
    // advances to the Summary screen.
    await this.sample.goNext();
    await this.notes.toggleSurveyComplete();
    await this.notes.setNotes("Test survey notes");
    await this.notes.goNext();
});

Then('the sample tray is filled with each identification', async function () {
    // Each tile in the sample tray exposes a composite accessibility label
    // of the form "Taxon <id>, <species name>, abundance <abundance>"
    // (SampleTaxaIcon.js). Verify each species is present with the
    // abundance set in the preceding step (default "1-2" when the slider
    // wasn't adjusted).
    await this.sample.waitFor();
    var taxa = [
        { name: "Acruroperla atra", abundance: "3-5" },
        { name: "Aeshnidae",        abundance: "6-10" },
        { name: "Agapetus",         abundance: "1-2" },
    ];
    for (var i = 0; i < taxa.length; i++) {
        var expected = `${taxa[i].name}, abundance ${taxa[i].abundance}`;
        var selector = this.platform === "ios"
            ? `-ios predicate string:label CONTAINS '${expected}'`
            : `android=new UiSelector().descriptionContains("${expected}")`;
        var el = await this.driver.$(selector);
        await el.waitForDisplayed({
            timeout: 10000,
            timeoutMsg: `${SAMPLE_TRAY_TILE_MISSING} for "${expected}"`,
        });
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
    await this.summary.goDone();
});

When('the user identifies a number of taxa', { timeout: 300000 }, async function () {
    // Add three taxa via the Browse (taxa list) path, matching by label so
    // the test doesn't depend on list coordinates. Navigating the key is
    // out of scope here — identify_taxa.feature covers that path. The
    // chosen species names sort early (after the "Order:" rows) to keep
    // the scroll-into-view loop short. Two of the three taxa also
    // exercise the abundance slider so the test covers non-default
    // abundance values alongside the default 1-2.
    var taxa = [
        { name: "Acruroperla atra", abundance: "3-5" },
        { name: "Aeshnidae",        abundance: "6-10" },
        { name: "Agapetus" }
    ];
    for (var i = 0; i < taxa.length; i++) {
        await this.sample.selectAddSample();
        await this.methodSelect.viaBrowse();
        await this.browse.chooseSpecies(taxa[i].name);
        await this.taxon.selectAddToSample();
        if (taxa[i].abundance) {
            await this.editTaxon.setAbundance(taxa[i].abundance);
        }
        // EditTaxon persists a taxon to the tray only after a photo is
        // captured and Save is pressed. The test camera (Camera-test.js)
        // stands in for the real camera on simulator builds.
        await this.editTaxon.openCamera();
        await this.camera.takePhoto();
        await this.editTaxon.waitFor();
        await this.editTaxon.save();
    }
});

// The key path from the survey tray's + must reach a taxon and store it — proving
// the identification methods stay enabled in a survey (training mode greys all but
// the key; that mode must not leak into a real survey).
When('the user identifies a taxon via the key', { timeout: 120000 }, async function () {
    const GASTROPOD = [
        "Animal with a shell (snails and mussels)",
        "Animals look like snails or limpets.",
        "Order level ID Gastropoda.",
    ];
    await this.sample.selectAddSample();
    await this.methodSelect.viaKey();
    for (const question of GASTROPOD) {
        await this.keySearch.choose(question);
    }
    await this.taxon.selectAddToSample();
    await this.editTaxon.openCamera();
    await this.camera.takePhoto();
    await this.editTaxon.waitFor();
    await this.editTaxon.save();
});

Then('the sample tray shows the key-identified taxon', async function () {
    await this.sample.waitFor();
    // The key path "Order level ID Gastropoda." stores taxon 181, whose tray tile
    // renders its name "gastropods" (SampleTaxaIcon accessibility label).
    const expected = "gastropods";
    const selector = this.platform === "ios"
        ? `-ios predicate string:label CONTAINS '${expected}'`
        : `android=new UiSelector().descriptionContains("${expected}")`;
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({
        timeout: 10000,
        timeoutMsg: `${SAMPLE_TRAY_TILE_MISSING} for key-identified "${expected}"`,
    });
});
