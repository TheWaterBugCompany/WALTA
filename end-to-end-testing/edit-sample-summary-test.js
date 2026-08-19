'use strict';
// Regression: the Summary was blank when reviewing a completed sample in Edit
// mode, because the view bound to the global sample singleton instead of the
// edited copy threaded through the flow. This drives the full create → store →
// edit → summary path against the real stack, so it lives in the end-to-end
// layer rather than the business-readable acceptance suite.

const { startGpsBroadcaster, stopGpsBroadcaster } = require('../features/support/gps-broadcaster');
const { loginViaDeepLink } = require('../features/support/deep-link-login');
const {
    SURVEY_TAXA, FULL_HABITAT,
    reachSampleTray, addTaxaViaBrowse, markSurveyComplete, submitFromSummary,
} = require('../features/support/survey-driver');

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
        await startGpsBroadcaster(global.world);
    });

    after(function () {
        stopGpsBroadcaster(global.world);
    });

    it('renders the edited sample on the summary, not a blank singleton', async function () {
        const world = global.world;
        await loginViaDeepLink(world, 'test@example.com');
        await reachSampleTray(world, {
            site: { waterbody: "Test Creek", feature: "Bridge", sitePhoto: true },
            habitat: FULL_HABITAT,
        });
        await addTaxaViaBrowse(world, SURVEY_TAXA);
        await markSurveyComplete(world);
        await submitFromSummary(world);
        await reopenFromHistoryToSummary(world);
        // siteInfo has no accessibility label, so its text is readable — evidence the
        // summary rendered the sample rather than a blank singleton.
        await world.summary.waitForText("Test Creek @ Bridge");
        await world.summary.waitForLabel("SIGNAL Score");
    });
});
