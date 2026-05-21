'use strict';
// Smoke test proving the revived end-to-end harness end to end: the mock
// CERDI server, app launch, deeplink login, and a full sync via the Sync
// button on the sample history screen. Green on `main` behaviour — it does
// not depend on the WB-8 sync split (the sync-resilience E2E tests that do
// land on the rebased WB-8 branch). Runs on both iOS and Android (driven by
// the PLATFORM env var via the root hooks in setup.js).

const APP_ID = 'net.thewaterbug.waterbug';

async function login(world, email) {
    await world.menu.waitFor();
    // Deeplink login — the app's UrlActions dispatcher calls
    // CerdiApi.loginUser then fires Topics.LOGGEDIN. Password is fixed to
    // match the mock CERDI server's /token/create stub.
    const url = `walta://login?email=${encodeURIComponent(email)}&password=password`;
    if (world.platform === 'android') {
        await world.driver.execute('mobile: deepLink', { url, package: APP_ID, waitForLaunch: false });
    } else {
        await world.driver.execute('mobile: deepLink', { url, bundleId: APP_ID });
    }
    await world.menu.waitForLabel('You are Logged in');
    // iOS re-opens the Menu on LOGGEDIN; let the new instance settle before
    // the next tap to avoid a stale-element click.
    if (world.platform === 'ios') await new Promise(r => setTimeout(r, 1500));
}

describe('E2E smoke: sync from sample history', function () {
    this.timeout(180000);

    it('logs in, opens history, and completes a sync', async function () {
        const world = global.world;
        await login(world, 'test@example.com');
        await world.menu.selectArchive();
        await world.archive.clickSyncNow();
        await world.syncFeedback.waitForSuccess();
    });
});
