'use strict';
// Log in via the walta://login deeplink — the e2e specs' fast path (the cucumber
// suite logs in through the UI form instead). Password is fixed to match the
// mock CERDI server's /token/create stub.

const APP_ID = 'net.thewaterbug.waterbug';

async function loginViaDeepLink(world, email) {
    await world.menu.waitFor();
    const url = `walta://login?email=${encodeURIComponent(email)}&password=password`;
    if (world.platform === 'android') {
        await world.driver.execute('mobile: deepLink', { url, package: APP_ID, waitForLaunch: false });
    } else {
        await world.driver.execute('mobile: deepLink', { url, bundleId: APP_ID });
    }
    await world.menu.waitForLoginSettled();
}

exports.loginViaDeepLink = loginViaDeepLink;
