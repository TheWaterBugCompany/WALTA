'use strict';
// Regression: a completed training session leaves the Training service holding a
// session tray. That state must not leak into a subsequent real survey — before
// the fix the survey's "Add to sample" was routed as a training identification,
// so the taxon editor never opened and the tray stayed empty.
//
// This is a mechanism-heavy full-stack flow (train, finish, then a full survey)
// proving the training→survey handoff holds under the real stack, so it lives in
// the end-to-end layer rather than the business-readable acceptance suite.

const { startGpsBroadcaster, stopGpsBroadcaster } = require('../features/support/gps-broadcaster');
const { loginViaDeepLink } = require('../features/support/deep-link-login');
const { completeTrainingSession } = require('../features/support/drivers/training-driver');
const {
    SURVEY_TAXA, FULL_HABITAT,
    reachSampleTray, addTaxaViaBrowse, expectTrayTile,
} = require('../features/support/drivers/survey-driver');

describe('E2E: a survey after a training session still records identifications', function () {
    this.timeout(600000);

    before(async function () {
        await startGpsBroadcaster(global.world);
    });

    after(function () {
        stopGpsBroadcaster(global.world);
    });

    it('records the survey identifications rather than an empty training tray', async function () {
        const world = global.world;
        await loginViaDeepLink(world, 'test@example.com');
        await completeTrainingSession(world);
        await reachSampleTray(world, {
            site: { waterbody: "Test Creek", feature: "Bridge", sitePhoto: true },
            habitat: FULL_HABITAT,
        });
        await addTaxaViaBrowse(world, SURVEY_TAXA);
        await world.sample.waitFor();
        for (const taxon of SURVEY_TAXA) {
            await expectTrayTile(world, `${taxon.name}, abundance ${taxon.abundance}`);
        }
    });
});
