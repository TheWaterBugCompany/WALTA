'use strict';
// Regression: a completed training session leaves the Training service holding a
// session tray. That state must not leak into a subsequent real survey — before
// the fix the survey's "Add to sample" was routed as a training identification,
// so the taxon editor never opened and the tray stayed empty.
//
// This is a mechanism-heavy full-stack flow (train, finish, then a full survey)
// proving the training→survey handoff holds under the real stack, so it lives in
// the end-to-end layer rather than the business-readable acceptance suite.

const APP_ID = 'net.thewaterbug.waterbug';

// Melbourne CBD — the survey form needs a GPS lock before Done enables.
const TEST_LAT = -37.8136;
const TEST_LNG = 144.9631;
const GPS_BROADCAST_INTERVAL_MS = 1000;

// Key question paths (verbatim from the taxonomy) for the exercise-999 taxa.
const GASTROPOD = [
    "Animal with a shell (snails and mussels)",
    "Animals look like snails or limpets.",
    "Order level ID Gastropoda.",
];
const LIMPET = [   // Ancylidae, taxonId 184 — the deliberately-wrong pick
    "Animal with a shell (snails and mussels)",
    "Animals look like snails or limpets.",
    "Identify further.",
    "Animals look like limpets.",
];
const MUSSEL = [   // Hyriidae, taxonId 179 — the correction
    "Animal with a shell (snails and mussels)",
    "Animals look like mussels.",
    "Class level ID. Bivalvia (mussels).",
];

// Three taxa added to the real survey via Browse — two exercise the abundance
// slider so non-default abundances are covered alongside the default 1-2.
const SURVEY_TAXA = [
    { name: "Acruroperla atra", abundance: "3-5" },
    { name: "Aeshnidae",        abundance: "6-10" },
    { name: "Agapetus",         abundance: "1-2" },
];

async function login(world, email) {
    await world.menu.waitFor();
    // Password is fixed to match the mock CERDI server's /token/create stub.
    const url = `walta://login?email=${encodeURIComponent(email)}&password=password`;
    if (world.platform === 'android') {
        await world.driver.execute('mobile: deepLink', { url, package: APP_ID, waitForLaunch: false });
    } else {
        await world.driver.execute('mobile: deepLink', { url, bundleId: APP_ID });
    }
    await world.menu.waitForLoginSettled();
}

// Continuous ~1Hz GPS broadcasts for the lifetime of the survey, decoupling the
// test from the app's listener-attach timing (mirrors features/step_definitions/gps_steps.js).
async function startGpsBroadcaster(world, lat, lng) {
    if (world._gpsBroadcaster) return;
    const broadcaster = { stopped: false, timer: null };
    world._gpsBroadcaster = broadcaster;
    world.pushGpsFix = async () => {
        try {
            await global.launcher.setLocation(lat, lng);
        } catch (_) {
            // Best-effort — a failed simctl/adb call doesn't matter; the next tick retries.
        }
    };
    const tick = async () => {
        if (broadcaster.stopped) return;
        await world.pushGpsFix();
        if (!broadcaster.stopped) broadcaster.timer = setTimeout(tick, GPS_BROADCAST_INTERVAL_MS);
    };
    await tick();
}

function stopGpsBroadcaster(world) {
    const broadcaster = world._gpsBroadcaster;
    if (!broadcaster) return;
    broadcaster.stopped = true;
    if (broadcaster.timer) clearTimeout(broadcaster.timer);
    world._gpsBroadcaster = null;
    world.pushGpsFix = null;
}

async function identifyTrainingTaxonViaKey(world, questions) {
    await world.sample.selectAddSample();
    await world.methodSelect.viaKey();
    for (const q of questions) await world.keySearch.choose(q);
    await world.taxon.waitFor();
    await world.taxon.addToTrainingSample();
}

async function completeTrainingSession(world) {
    await world.menu.selectAcademy();
    await world.academy.enterCode("999");
    await world.academy.waitForStartAvailable();
    await world.academy.start();
    await identifyTrainingTaxonViaKey(world, GASTROPOD);
    await identifyTrainingTaxonViaKey(world, LIMPET);
    await world.sample.assess();
    await world.sample.reidentifyTaxon(184);   // tap the wrong Ancylidae
    await world.methodSelect.viaKey();
    for (const q of MUSSEL) await world.keySearch.choose(q);
    await world.taxon.waitFor();
    await world.taxon.addToTrainingSample();
    await world.sample.assess();
    await world.trainingSuccess.waitFor();
    await world.trainingSuccess.finish();
}

async function runSurvey(world) {
    await world.menu.selectWaterbugSurvey();
    await world.siteDetails.selectDetailed();
    await world.siteDetails.selectRiver();
    await world.siteDetails.setWaterbodyName("Test Creek");
    await world.siteDetails.setNearByFeature("Bridge");
    // Opening the camera pauses GPS; wait for the fix first so Done isn't left disabled.
    await world.siteDetails.waitForLocationLock();
    await world.siteDetails.selectSitePhoto();
    await world.camera.takePhoto();
    await world.siteDetails.goNext();

    // Habitat values must sum to 100% or Next stays disabled.
    await world.habitat.setLeafPacks("20");
    await world.habitat.setAquaticPlants("10");
    await world.habitat.setWood("10");
    await world.habitat.setEdgePlants("10");
    await world.habitat.setBoulders("10");
    await world.habitat.setGravel("10");
    await world.habitat.setSandOrSilt("20");
    await world.habitat.setOpenWater("10");
    await world.habitat.goNext();

    for (const taxon of SURVEY_TAXA) {
        await world.sample.selectAddSample();
        await world.methodSelect.viaBrowse();
        await world.browse.chooseSpecies(taxon.name);
        await world.taxon.selectAddToSample();
        if (taxon.abundance !== "1-2") await world.editTaxon.setAbundance(taxon.abundance);
        // EditTaxon persists a taxon only after a photo is captured and Save is pressed.
        await world.editTaxon.openCamera();
        await world.camera.takePhoto();
        await world.editTaxon.waitFor();
        await world.editTaxon.save();
    }
}

async function expectTrayContains(world, taxon) {
    // Each tile exposes a composite accessibility label "Taxon <id>, <name>, abundance <abundance>"
    // (SampleTaxaIcon.js). A missing tile means the identification was never recorded.
    const expected = `${taxon.name}, abundance ${taxon.abundance}`;
    const selector = world.platform === 'ios'
        ? `-ios predicate string:label CONTAINS '${expected}'`
        : `android=new UiSelector().descriptionContains("${expected}")`;
    const el = await world.driver.$(selector);
    await el.waitForDisplayed({ timeout: 10000, timeoutMsg: `sample tray tile missing for "${expected}"` });
}

describe('E2E: a survey after a training session still records identifications', function () {
    this.timeout(600000);

    before(async function () {
        await startGpsBroadcaster(global.world, TEST_LAT, TEST_LNG);
    });

    after(function () {
        stopGpsBroadcaster(global.world);
    });

    it('records the survey identifications rather than an empty training tray', async function () {
        const world = global.world;
        await login(world, 'test@example.com');
        await completeTrainingSession(world);
        await runSurvey(world);
        await world.sample.waitFor();
        for (const taxon of SURVEY_TAXA) await expectTrayContains(world, taxon);
    });
});
