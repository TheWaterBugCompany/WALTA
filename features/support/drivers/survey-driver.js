'use strict';
// Shared survey flows for both the cucumber acceptance suite and the Mocha e2e
// specs. Drivers take `world` and drive cross-screen flows; single-screen
// actions stay on the screen page-objects.
//
// The site-details/habitat fill is parameterised so the short form (waterbody
// "a", sand-only, no site photo — enough to reach the sample tray) and the
// maximal form (named waterbody + feature + site photo + a full habitat spread)
// share one definition.

// Three taxa added via Browse — two carry a non-default abundance so the slider
// is exercised alongside the default 1-2.
const SURVEY_TAXA = [
    { name: "Acruroperla atra", abundance: "3-5" },
    { name: "Aeshnidae",        abundance: "6-10" },
    { name: "Agapetus",         abundance: "1-2" },
];

// A full eight-substrate spread summing to 100% (Next stays disabled otherwise).
const FULL_HABITAT = {
    leafPacks: "20", aquaticPlants: "10", wood: "10", edgePlants: "10",
    boulders: "10", gravel: "10", sandOrSilt: "20", openWater: "10",
};

// Fill the site-details screen and advance. Short form (default) sets only the
// waterbody name. Pass `feature` to also set the nearby feature, and `sitePhoto`
// to capture a site photo — which first waits for a GPS lock, since opening the
// camera pauses GPS and would otherwise leave Done disabled.
async function fillSiteDetails(world, { waterbody = "a", feature, sitePhoto = false } = {}) {
    await world.menu.selectWaterbugSurvey();
    await world.siteDetails.selectDetailed();
    await world.siteDetails.selectRiver();
    await world.siteDetails.setWaterbodyName(waterbody);
    if (feature) await world.siteDetails.setNearByFeature(feature);
    if (sitePhoto) {
        await world.siteDetails.waitForLocationLock();
        await world.siteDetails.selectSitePhoto();
        await world.camera.takePhoto();
    }
    await world.siteDetails.goNext();
}

// Fill the habitat screen and advance. Default puts everything in sand/silt;
// pass a distribution (e.g. FULL_HABITAT) to spread across all eight substrates.
async function fillHabitat(world, distribution) {
    if (distribution) {
        await world.habitat.setLeafPacks(distribution.leafPacks);
        await world.habitat.setAquaticPlants(distribution.aquaticPlants);
        await world.habitat.setWood(distribution.wood);
        await world.habitat.setEdgePlants(distribution.edgePlants);
        await world.habitat.setBoulders(distribution.boulders);
        await world.habitat.setGravel(distribution.gravel);
        await world.habitat.setSandOrSilt(distribution.sandOrSilt);
        await world.habitat.setOpenWater(distribution.openWater);
    } else {
        await world.habitat.setSandOrSilt("100");
    }
    await world.habitat.goNext();
}

// Fill site details + habitat and land on the sample tray. `site` and `habitat`
// pass through to fillSiteDetails / fillHabitat.
async function reachSampleTray(world, { site, habitat } = {}) {
    await fillSiteDetails(world, site);
    await fillHabitat(world, habitat);
    await world.sample.waitFor();
}

// Add each taxon to the sample via Browse, with a photo. `taxa` defaults to
// SURVEY_TAXA. A taxon's abundance is set only when it differs from the default
// 1-2 (a missing abundance means "leave the default").
async function addTaxaViaBrowse(world, taxa = SURVEY_TAXA) {
    for (const taxon of taxa) {
        await world.sample.selectAddSample();
        await world.methodSelect.viaBrowse();
        await world.browse.chooseSpecies(taxon.name);
        await world.taxon.selectAddToSample();
        if (taxon.abundance && taxon.abundance !== "1-2") {
            await world.editTaxon.setAbundance(taxon.abundance);
        }
        // EditTaxon persists a taxon only after a photo is captured and Save is pressed.
        await world.editTaxon.openCamera();
        await world.camera.takePhoto();
        await world.editTaxon.waitFor();
        await world.editTaxon.save();
    }
}

// Add a taxon to the sample via the key, with a photo. The survey path — ends on
// selectAddToSample + save, unlike training (see training-driver).
async function addTaxonViaKeyToSample(world, questions) {
    await world.sample.selectAddSample();
    await world.methodSelect.viaKey();
    for (const q of questions) await world.keySearch.choose(q);
    await world.taxon.selectAddToSample();
    await world.editTaxon.openCamera();
    await world.camera.takePhoto();
    await world.editTaxon.waitFor();
    await world.editTaxon.save();
}

// Add a taxon to the sample via the speedbug (no photo/save step).
async function addTaxonViaSpeedBug(world, refId) {
    await world.sample.waitFor();
    await world.sample.selectAddSample();
    await world.methodSelect.viaSpeedbug();
    await world.speedbug.chooseSpeedbug(refId);
    await world.taxon.selectAddToSample();
}

// Mark the survey complete on the Notes screen and advance to the Summary.
async function markSurveyComplete(world, notes = "Test survey notes") {
    await world.sample.goNext();
    await world.notes.toggleSurveyComplete();
    await world.notes.setNotes(notes);
    await world.notes.goNext();
}

// Press Done on the Summary — persists the sample and returns to the menu.
async function submitFromSummary(world) {
    await world.summary.goDone();
}

// Assert a tray tile whose accessibility label contains `text` is shown
// (SampleTaxaIcon composes "Taxon <id>, <name>, abundance <abundance>"). Pass a
// `timeoutMsg` to feed the environmental-failure classifier (SAMPLE_TRAY_TILE_MISSING).
async function expectTrayTile(world, text, timeoutMsg) {
    const selector = world.platform === "ios"
        ? `-ios predicate string:label CONTAINS '${text}'`
        : `android=new UiSelector().descriptionContains("${text}")`;
    const el = await world.driver.$(selector);
    await el.waitForDisplayed({
        timeout: 10000,
        timeoutMsg: timeoutMsg || `sample tray tile missing for "${text}"`,
    });
}

exports.SURVEY_TAXA = SURVEY_TAXA;
exports.FULL_HABITAT = FULL_HABITAT;
exports.fillSiteDetails = fillSiteDetails;
exports.fillHabitat = fillHabitat;
exports.reachSampleTray = reachSampleTray;
exports.addTaxaViaBrowse = addTaxaViaBrowse;
exports.addTaxonViaKeyToSample = addTaxonViaKeyToSample;
exports.addTaxonViaSpeedBug = addTaxonViaSpeedBug;
exports.markSurveyComplete = markSurveyComplete;
exports.submitFromSummary = submitFromSummary;
exports.expectTrayTile = expectTrayTile;
