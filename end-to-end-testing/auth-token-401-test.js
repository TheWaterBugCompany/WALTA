'use strict';
// End-to-end auth-401 resilience. Two token types, two behaviours:
//   1. The *server* token gates login. If it's rejected (server-side
//      invalidation), the client refreshes it and retries — login recovers
//      (WB-185). Regression proof at the full-stack layer.
//   2. The *user* token gates logged-in sync. It can't be refreshed without
//      the password, so a 401 mid-sync drops the app to the login screen to
//      re-authenticate (WB-186), instead of retrying a dead token forever.
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

describe('E2E auth: 401 handling for server and user tokens', function () {
    this.timeout(300000);

    afterEach(function () {
        // Leave the server healthy for the next spec.
        global.mockCerdiServer.setUserTokenInvalid(false);
    });

    it('recovers login by refreshing the server token when it is rejected with 401', async function () {
        const world = global.world;
        const mock = global.mockCerdiServer;

        // Arm a one-shot 401 on the server-token-bearing login request. A client
        // without the WB-185 refresh would surface the 401 and never log in.
        const fetchesBefore = mock.serverTokenFetchCount();
        mock.setServerTokenRejectOnce();

        await login(world, 'test@example.com');

        // Reaching the logged-in state despite the injected 401 is the recovery;
        // the extra /token/create/server fetch is the refresh that made it work.
        await world.menu.waitForLabel('You are Logged in');
        expect(mock.serverTokenFetchCount()).to.be.greaterThan(fetchesBefore);
    });

    it('drops to the login screen when the user token is rejected mid-sync', async function () {
        const world = global.world;
        const mock = global.mockCerdiServer;

        await login(world, 'test@example.com');

        // The user changed their password elsewhere: the stored session token is
        // now invalid, but the app doesn't know until its next authenticated call.
        mock.setUserTokenInvalid(true);

        await world.menu.selectArchive();
        // Tap Sync but don't wait on the feedback overlay — the rejected session
        // drops straight to login, covering the overlay before it settles.
        await world.archive.tapSync();

        // The sync's authenticated request 401s; the app can't refresh a user
        // token, so it must return the user to the login screen to re-authenticate.
        await world.login.waitFor();
    });
});
