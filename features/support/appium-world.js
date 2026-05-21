'use strict';
// Shared Appium orchestration for BOTH the cucumber acceptance suite
// (features/) and the Mocha end-to-end suite (end-to-end-testing/). The
// mock-server start, launch-arg computation, per-platform app preparation
// and the between-test reset are identical for the two runners, so they
// live here once rather than being duplicated. The functions set the same
// globals (global.launcher / global.driver / global.mockCerdiServer /
// global.platform / global.isSimulator) both runners and the step/test
// files rely on.

const path = require('path');
const { execFileSync } = require('child_process');
const { createMockCerdiServer } = require('./mock-cerdi-server');

const APP_ID = 'net.thewaterbug.waterbug';

// The mock CERDI server runs on the host loopback (127.0.0.1:9999).
// Android emulator can only reach it via 10.0.2.2; iOS sim shares the
// host network. The override URL + secret are passed to the app as
// launch args (Android intent extras / iOS process arguments — see
// alloy.js + AppiumLauncher) so any build can be redirected to the mock
// without rebuilding. The secret matches the fixed client_secret the
// mock server expects in mock-cerdi-server.js.
const MOCK_CERDI_SECRET = "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz";

function adb() {
    return process.env.ANDROID_SDK_ROOT
        ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
        : 'adb';
}

function mockCerdiUrl() {
    if (process.env.MOCK_CERDI_URL) return process.env.MOCK_CERDI_URL;
    if (global.platform === 'android' && global.isSimulator) return 'http://10.0.2.2:9999';
    return 'http://127.0.0.1:9999';
}

function launchArgs() {
    return {
        cerdiServerUrl: mockCerdiUrl(),
        cerdiApiSecret: MOCK_CERDI_SECRET,
    };
}

// Start the mock CERDI server BEFORE launching the app — the app's
// auto-login hits /token/create at boot, so the stub must be available
// by then. Canned sample data is set up here too so the first sync
// after login finds it.
async function startMockServer() {
    if (!global.mockCerdiServer) {
        await new Promise((resolve) => {
            global.mockCerdiServer = createMockCerdiServer(resolve);
        });
        global.mockCerdiServer.makeMockSample();
    }
}

// Connect Appium and bring the app to a clean, foreground state.
// Mirrors the (proven-green) acceptance BeforeAll sequence exactly.
async function connectAndPrepareApp({ platform, isSimulator }) {
    global.platform = platform;
    global.isSimulator = !!isSimulator;

    // Wipe app state so each run starts clean. Done BEFORE Appium creates
    // its session so the auto-launch via appium:optionalIntentArguments
    // lands on the freshly-cleared app — pm clear after session-create
    // would negate the launch (extras don't propagate via relaunch).
    if (platform === 'android' && isSimulator) {
        try {
            execFileSync(adb(), ['shell', 'pm', 'clear', APP_ID]);
            execFileSync(adb(), ['shell', 'pm', 'grant', APP_ID, 'android.permission.ACCESS_FINE_LOCATION']);
            execFileSync(adb(), ['shell', 'pm', 'grant', APP_ID, 'android.permission.ACCESS_COARSE_LOCATION']);
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
    // Wipe keychain so iCloud-saved passwords don't trigger AutoFill prompts.
    try {
        execFileSync('xcrun', ['simctl', 'keychain', udid, 'reset']);
    } catch (e) {
        console.warn(`[appium-world] simctl keychain reset failed: ${e.message}`);
    }
    // Disable iOS Password AutoFill so the "Save this Password?" sheet
    // (not a UIAlertController, so autoDismissAlerts can't catch it)
    // doesn't race the next tap after the login form submits.
    try {
        execFileSync('xcrun', ['simctl', 'spawn', udid,
            'defaults', 'write', 'com.apple.WebUIKit',
            'StoredCredentialsEnabled', '-bool', 'false']);
    } catch (e) {
        console.warn(`[appium-world] disabling AutoFill failed: ${e.message}`);
    }
    try { await global.driver.removeApp(appId); } catch (_) {}
    await global.driver.installApp(appPath);
    // Pre-grant location ("location" only, not "location-always" — the app
    // requests WHEN_IN_USE and Ti.Geolocation refuses to lower an ALWAYS
    // grant, silently never starting the listener).
    try {
        execFileSync('xcrun', ['simctl', 'privacy', udid, 'grant', 'location', appId]);
    } catch (e) {
        console.warn(`[appium-world] simctl privacy failed: ${e.message}`);
    }
    // Reinstall leaves the app not running — activate it and wait for the
    // foreground state before the first step drives the UI.
    await global.launcher.launch(appId, launchArgs());
    for (let i = 0; i < 60; i++) {
        const state = await global.driver.execute('mobile: queryAppState', { bundleId: appId });
        if (state === 4) break;
        await new Promise(r => setTimeout(r, 500));
    }
}

// In-app reset via the `walta://reset` deeplink (lib/util/AppReset.js):
// clears auth tokens, wipes sample/taxa tables, re-instantiates models,
// fires Topics.HOME. Registered only in non-production builds.
async function resetApp() {
    const appId = global.launcher.appId;
    const url = 'walta://reset';
    if (global.platform === 'android') {
        await global.driver.execute('mobile: deepLink', { url, package: appId, waitForLaunch: false });
    } else {
        await global.driver.execute('mobile: deepLink', { url, bundleId: appId });
    }
    // Topics.HOME → Navigation.openController("Menu") is async; let the new
    // Menu window land before the next step queries the UI.
    await new Promise(r => setTimeout(r, 500));
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
    teardown,
};
