'use strict';
// Proves WB-8 resilience end to end: a user-requested full sync that fails
// part-way (fullSyncPending stays set) resumes on the next app launch —
// the app re-fetches the history on its own, without the user asking again.
const { launchArgs } = require('../features/support/appium-world');

const APP_ID = 'net.thewaterbug.waterbug';

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

async function waitUntil(predicate, { timeout = 60000, interval = 250 } = {}) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (await predicate()) return;
        await new Promise(r => setTimeout(r, interval));
    }
    throw new Error('waitUntil timed out');
}

describe('E2E resilience: an interrupted full sync resumes after relaunch', function () {
    this.timeout(300000);

    afterEach(function () {
        // Leave the server healthy for the next spec.
        global.mockCerdiServer.setSampleFetchFailing(false);
    });

    it('re-fetches the history on its own after a force-quit relaunch', async function () {
        const world = global.world;
        await login(world, 'test@example.com');

        // Fail every history download so the user-requested full sync errors out
        // with fullSyncPending still set — the interruption a restart must survive.
        global.mockCerdiServer.setSampleFetchFailing(true);

        await world.menu.selectArchive();
        await world.archive.clickSyncNow();

        // Confirm the full sync actually reached its download phase (so the
        // pending-sync intent is recorded) before we kill the app.
        await waitUntil(() => global.mockCerdiServer.samplesFetchCount() >= 1);

        // Force-quit through the launcher; the persisted auth token and
        // fullSyncPending flag survive (no reinstall). Count fetches once the
        // app is dead so nothing in flight can inflate the baseline.
        await global.launcher.terminate(APP_ID);
        const fetchesBeforeRelaunch = global.mockCerdiServer.samplesFetchCount();

        await global.launcher.launch(APP_ID, launchArgs());
        await global.launcher.waitForForeground();

        // The app resumes the pending full sync on boot — it re-fetches /samples
        // without the user tapping Sync again. There is no auto-sync on login, so
        // a fresh fetch can only come from the persisted fullSyncPending flag.
        await waitUntil(
            () => global.mockCerdiServer.samplesFetchCount() > fetchesBeforeRelaunch,
            { timeout: 120000 });
    });

    it('resumes the pending full sync when brought back to the foreground', async function () {
        const world = global.world;
        await login(world, 'test@example.com');

        global.mockCerdiServer.setSampleFetchFailing(true);

        await world.menu.selectArchive();
        await world.archive.clickSyncNow();

        // The download has been attempted and failed, so fullSyncPending stays
        // set. No retry fires on its own — the backstop is ~30 min away — so the
        // fetch count is quiet until we bring the app back to the foreground.
        await waitUntil(() => global.mockCerdiServer.samplesFetchCount() >= 1);
        const fetchesBeforeBackground = global.mockCerdiServer.samplesFetchCount();

        // Background then foreground: the app's resume handler flushes the
        // pending full sync, re-fetching /samples without a fresh Sync tap.
        await global.launcher.background(2);
        await global.launcher.waitForForeground();

        await waitUntil(
            () => global.mockCerdiServer.samplesFetchCount() > fetchesBeforeBackground,
            { timeout: 120000 });
    });
});
