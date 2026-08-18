'use strict';
// Regression: the Summary was blank when reviewing a completed sample in Edit
// mode, because the view bound to the global sample singleton instead of the
// edited copy threaded through the flow. This drives the full create → store →
// edit → summary path against the real stack, so it lives in the end-to-end
// layer rather than the business-readable acceptance suite.

const APP_ID = 'net.thewaterbug.waterbug';

// Melbourne CBD — the survey form needs a GPS lock before Done enables.
const TEST_LAT = -37.8136;
const TEST_LNG = 144.9631;
const GPS_BROADCAST_INTERVAL_MS = 1000;

// Three taxa added via Browse — two exercise the abundance slider.
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

async function fillSurvey(world) {
    await world.menu.selectWaterbugSurvey();
    await world.siteDetails.selectDetailed();
    await world.siteDetails.selectRiver();
    await world.siteDetails.setWaterbodyName("Test Creek");
    await world.siteDetails.setNearByFeature("Bridge");
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
        await world.editTaxon.openCamera();
        await world.camera.takePhoto();
        await world.editTaxon.waitFor();
        await world.editTaxon.save();
    }
}

async function completeAndStore(world) {
    await world.sample.goNext();
    await world.notes.toggleSurveyComplete();
    await world.notes.setNotes("Test survey notes");
    await world.notes.goNext();
    await world.summary.goDone();   // persists the sample, returns to the menu
}

async function reopenFromHistoryToSummary(world) {
    await world.menu.selectArchive();
    await world.archive.clickRow();
    await world.sampleEditMenu.selectEdit();
    await world.siteDetails.waitForLocationLock();
    await world.siteDetails.goNext();
    await world.habitat.goNext();
    await world.sample.goNext();
    await world.notes.goNext();
    await world.summary.waitFor();
}

describe('E2E: editing a completed sample shows a populated summary', function () {
    this.timeout(600000);

    before(async function () {
        await startGpsBroadcaster(global.world, TEST_LAT, TEST_LNG);
    });

    after(function () {
        stopGpsBroadcaster(global.world);
    });

    it('renders the edited sample on the summary, not a blank singleton', async function () {
        const world = global.world;
        await login(world, 'test@example.com');
        await fillSurvey(world);
        await completeAndStore(world);
        await reopenFromHistoryToSummary(world);
        // siteInfo has no accessibility label, so its text is readable — evidence the
        // summary rendered the sample rather than a blank singleton.
        await world.summary.waitForText("Test Creek @ Bridge");
        await world.summary.waitForLabel("SIGNAL Score");
    });
});
