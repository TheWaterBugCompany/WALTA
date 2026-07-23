'use strict';
// Shared Appium orchestration for the cucumber acceptance suite and the
// Mocha end-to-end suite — see docs/testing.md.

const path = require('path');
const { execFileSync } = require('child_process');
const { createMockCerdiServer } = require('./mock-cerdi-server');
const recoverSession = require('./recover-session');
const dismissPermissionAlert = require('./dismiss-permission-alert');

const APP_ID = 'net.thewaterbug.waterbug';

// Matches the fixed client_secret the mock server expects (mock-cerdi-server.js).
const MOCK_CERDI_SECRET = "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz";

function adb() {
    return process.env.ANDROID_SDK_ROOT
        ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
        : 'adb';
}

// Scope adb to a specific device when ANDROID_SERIAL is set, so `pm clear`
// etc. don't fail with "more than one device/emulator" on a dev box that
// has both an emulator and a physical phone attached (WB-105).
function adbDeviceArgs() {
    return process.env.ANDROID_SERIAL ? ['-s', process.env.ANDROID_SERIAL] : [];
}

function mockCerdiUrl() {
    if (process.env.MOCK_CERDI_URL) return process.env.MOCK_CERDI_URL;
    // Android emulator reaches the host loopback only via 10.0.2.2.
    if (global.platform === 'android' && global.isSimulator) return 'http://10.0.2.2:9999';
    return 'http://127.0.0.1:9999';
}

function launchArgs() {
    return {
        cerdiServerUrl: mockCerdiUrl(),
        cerdiApiSecret: MOCK_CERDI_SECRET,
    };
}

// Must start before the app launches — auto-login hits /token/create at boot.
async function startMockServer() {
    if (!global.mockCerdiServer) {
        await new Promise((resolve) => {
            global.mockCerdiServer = createMockCerdiServer(resolve);
        });
        global.mockCerdiServer.makeMockSample();
    }
}

async function connectAndPrepareApp({ platform, isSimulator }) {
    global.platform = platform;
    global.isSimulator = !!isSimulator;

    // Clear app state before Appium creates the session: the auto-launch via
    // appium:optionalIntentArguments must land on the cleared app, and extras
    // don't propagate to a relaunch (a pm clear afterwards would negate it).
    if (platform === 'android' && isSimulator) {
        try {
            const dev = adbDeviceArgs();
            execFileSync(adb(), [...dev, 'shell', 'pm', 'clear', APP_ID]);
            execFileSync(adb(), [...dev, 'shell', 'pm', 'grant', APP_ID, 'android.permission.ACCESS_FINE_LOCATION']);
            execFileSync(adb(), [...dev, 'shell', 'pm', 'grant', APP_ID, 'android.permission.ACCESS_COARSE_LOCATION']);
            // WB-10b: the sync nudge is a notification-dot; Android 13+ needs
            // POST_NOTIFICATIONS granted before the notification (hence dot)
            // shows. Pre-33 doesn't define the permission — `pm grant` throws
            // "Unknown permission" there, which is expected and harmless.
            try {
                execFileSync(adb(), [...dev, 'shell', 'pm', 'grant', APP_ID, 'android.permission.POST_NOTIFICATIONS']);
            } catch (_) { /* pre-Android-13: no runtime notification permission */ }
            // Android 13+ gallery import needs READ_MEDIA_IMAGES; pre-grant so
            // openPhotoGallery goes straight to the picker. Pre-33 doesn't
            // define it — `pm grant` throws there, which is expected.
            try {
                execFileSync(adb(), [...dev, 'shell', 'pm', 'grant', APP_ID, 'android.permission.READ_MEDIA_IMAGES']);
            } catch (_) { /* pre-Android-13: no runtime media-images permission */ }
        } catch (e) {
            console.warn(`[appium-world] adb pm clear/grant failed: ${e.message}`);
        }
    }

    const { default: AppiumLauncher } = await import('../../build-utils/AppiumLauncher.js');
    global.launcher = new AppiumLauncher(platform, { isSimulator, launchArgs: launchArgs() });
    global.driver = await global.launcher.connect();

    if (platform === 'ios' && isSimulator) {
        await prepareIosSimApp();
    }
    return { launcher: global.launcher, driver: global.driver };
}

async function prepareIosSimApp() {
    const appId = global.launcher.appId;
    const appPath = path.resolve(process.cwd(), 'builds/test-sim/Waterbug.app');
    const udid = process.env.SIM_UDID;
    try {
        execFileSync('xcrun', ['simctl', 'keychain', udid, 'reset']);
    } catch (e) {
        console.warn(`[appium-world] simctl keychain reset failed: ${e.message}`);
    }
    try { await global.driver.removeApp(appId); } catch (_) {}
    await global.driver.installApp(appPath);
    // "location" not "location-always": the app requests WHEN_IN_USE and
    // Ti.Geolocation won't lower an ALWAYS grant, silently never listening.
    try {
        execFileSync('xcrun', ['simctl', 'privacy', udid, 'grant', 'location', appId]);
    } catch (e) {
        console.warn(`[appium-world] simctl privacy failed: ${e.message}`);
    }
    await global.launcher.launch(appId, launchArgs());
    for (let i = 0; i < 60; i++) {
        const state = await global.driver.execute('mobile: queryAppState', { bundleId: appId });
        if (state === 4) break;
        await new Promise(r => setTimeout(r, 500));
    }
    // index-app requests notification (badge) permission at startup (WB-10); the
    // system alert overlays the menu. Pre-granting it isn't an option — simctl
    // privacy has no notifications service — so dismiss it by tapping. Poll and
    // re-tap until the menu is actually reachable: a one-shot tap misses a late
    // alert and a tap WDA reports as succeeded but that didn't close the alert.
    await dismissPermissionAlert({
        isDone: () => isDisplayed('~Waterbug Survey.'),
        tapAccept: () => tapIfDisplayed("-ios predicate string:label == 'Allow'"),
        sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    });
}

async function isDisplayed(selector) {
    try {
        return await (await global.driver.$(selector)).isDisplayed();
    } catch (_) {
        return false;
    }
}

async function tapIfDisplayed(selector) {
    try {
        const el = await global.driver.$(selector);
        if (await el.isDisplayed()) await el.click();
    } catch (_) { /* not present or stale — the next poll retries */ }
}

// In-app reset via the `walta://reset` deeplink (lib/util/AppReset.js).
async function resetApp() {
    const appId = global.launcher.appId;
    const url = 'walta://reset';
    if (global.platform === 'android') {
        await global.driver.execute('mobile: deepLink', { url, package: appId, waitForLaunch: false });
    } else {
        await global.driver.execute('mobile: deepLink', { url, bundleId: appId });
    }
    // Reset announces the logout (menu shows "Log In") only *after* it has
    // quiesced any in-flight sync and cleared the token — so the Log In button
    // is a reliable "reset complete" signal. Polling for it (rather than a
    // fixed sleep) avoids the race where the next scenario logs in before
    // reset finishes and reset then nulls the freshly-set token.
    await global.driver.waitUntil(async () => {
        const el = await global.driver.$('~Log In.');
        return el.isDisplayed().catch(() => false);
    }, { timeout: 15000, interval: 200, timeoutMsg: 'app did not return to the logged-out menu after reset' });
}

async function sessionIsAlive() {
    if (!global.driver) return false;
    try {
        await global.driver.getPageSource();
        return true;
    } catch (_) {
        return false;
    }
}

// Contended CI runners occasionally drop the WDA/Appium session mid-run
// (WB-149). The session is created once and reused across scenarios, so a
// drop would otherwise fail every remaining scenario with "session is either
// terminated or not started". Rebuild it instead. Returns true when it had to
// reconnect — the caller then skips the in-app reset, since a reconnected app
// is freshly launched (iOS reinstalls; Android relaunches) and already at a
// clean starting point.
async function recoverSessionIfDead() {
    const reconnected = await recoverSession({
        isAlive: sessionIsAlive,
        reconnect: async () => {
            console.warn('[appium-world] driver session is dead — reconnecting');
            global.driver = await global.launcher.reconnect();
        },
    });
    if (reconnected && global.platform === 'ios' && global.isSimulator) {
        await prepareIosSimApp();
    }
    return reconnected;
}

async function teardown() {
    if (global.launcher) await global.launcher.stop();
    if (global.mockCerdiServer) {
        global.mockCerdiServer.shutdown();
        global.mockCerdiServer = null;
    }
}

module.exports = {
    APP_ID,
    MOCK_CERDI_SECRET,
    mockCerdiUrl,
    launchArgs,
    startMockServer,
    connectAndPrepareApp,
    resetApp,
    recoverSessionIfDead,
    sessionIsAlive,
    teardown,
};
