'use strict';
// Smoke test for the revived end-to-end harness: mock server, launch,
// deeplink login, full sync via the Sync button. Runs on iOS and Android.

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
