'use strict';
// Regression: the key is the only identification path allowed in training. The
// anchor bar must not offer the speedbug/browse shortcuts, which would otherwise
// slip past the greyed Method Select and defeat the exercise. This drives the
// real screen stack to prove the shortcuts are absent, so it lives in the
// end-to-end layer rather than the business-readable acceptance suite.

const { startTrainingSession } = require('../features/support/training-driver');

async function beginTrainingIdentifyViaKey(world) {
    await world.menu.selectAcademy();
    await startTrainingSession(world, "999");
    await world.sample.waitFor();   // the empty training tray
    await world.sample.selectAddSample();
    await world.methodSelect.viaKey();
}

describe('E2E: training keeps the key as the only identification path', function () {
    this.timeout(180000);

    it('does not offer the speedbug or browse anchor shortcuts during training', async function () {
        const world = global.world;
        await beginTrainingIdentifyViaKey(world);
        expect(await world.keySearch.shortcutPresent("Speedbug")).to.equal(false);
        expect(await world.keySearch.shortcutPresent("Browse")).to.equal(false);
    });
});
