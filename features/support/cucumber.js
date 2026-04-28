'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');
const { createMockCerdiServer } = require('./mock-cerdi-server');

// Arbitrary but plausible location (Melbourne CBD) — the Summary screen
// disables Done until the sample has a GPS lock, so acceptance runs need
// a fix before reaching Summary.
const TEST_LAT = -37.8136;
const TEST_LNG = 144.9631;

function adb() {
    return process.env.ANDROID_SDK_ROOT
        ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
        : 'adb';
}

function setAndroidLocation() {
    // `adb emu geo fix` takes longitude first, then latitude — opposite
    // of simctl's lat,lng order. The emulator's AndroidLocationManager
    // forwards this to Ti.Geolocation listeners.
    try {
        execFileSync(adb(), ['emu', 'geo', 'fix', String(TEST_LNG), String(TEST_LAT)]);
    } catch (e) {
        console.warn(`[BeforeAll] adb emu geo fix failed: ${e.message}`);
    }
}

// Device interactions are slow — 60s per step is the working baseline.
setDefaultTimeout(60 * 1000);

// The mock CERDI server runs on the host loopback (127.0.0.1:9999).
// Android emulator can only reach it via 10.0.2.2; iOS sim shares
// the host network. The override URL + secret are passed to the
// app as Android intent extras (see alloy.js + AppiumLauncher) so
// any build (test/production) can be redirected to the mock without
// rebuilding. The secret matches the fixed client_secret the mock
// server expects in mock-cerdi-server.js.
const MOCK_CERDI_SECRET = "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz";

function mockCerdiUrl() {
    if (process.env.MOCK_CERDI_URL) return process.env.MOCK_CERDI_URL;
    if (global.platform === 'android' && global.isSimulator) return 'http://10.0.2.2:9999';
    return 'http://127.0.0.1:9999';
}

function launchArgs() {
    return {
        cerdiServerUrl: mockCerdiUrl(),
        cerdiApiSecret: MOCK_CERDI_SECRET,
        // Auto-login at app boot via CerdiApi.loginUser — bypasses the
        // login UI entirely so we never trigger iOS's "Save Password?"
        // sheet. The mock-cerdi-server's /token/create stub authenticates
        // these credentials against its canned test user.
        userEmail: "test@example.com",
        userPassword: "password",
    };
}

// AppiumLauncher.connect() can take several minutes on iOS when WebDriverAgent
// is built from source on a cold runner — give the hook generous headroom.
BeforeAll({ timeout: 600 * 1000 }, async function () {
    const opts = JSON.parse(process.env.APPIUM_OPTIONS || '{}');
    if (!opts.platform) {
        throw new Error("APPIUM_OPTIONS must include 'platform'");
    }
    global.platform = opts.platform;
    global.isSimulator = !!opts.isSimulator;
    global.first = true;
    // Wipe app state (sqlite DB, filesystem, etc.) so each acceptance run
    // starts from a clean slate. Done BEFORE Appium creates its session,
    // so the auto-launch via `appium:optionalIntentArguments` lands on
    // the freshly-cleared app — pm clear after session-create would
    // negate the launch and force us to relaunch (where extras don't
    // propagate via mobile: startActivity).
    const appId = 'net.thewaterbug.waterbug';
    if (opts.platform === 'android' && opts.isSimulator) {
        try {
            execFileSync(adb(), ['shell', 'pm', 'clear', appId]);
            execFileSync(adb(), ['shell', 'pm', 'grant', appId, 'android.permission.ACCESS_FINE_LOCATION']);
            execFileSync(adb(), ['shell', 'pm', 'grant', appId, 'android.permission.ACCESS_COARSE_LOCATION']);
        } catch (e) {
            console.warn(`[BeforeAll] adb pm clear/grant failed: ${e.message}`);
        }
    }
    // Start the mock CERDI server BEFORE launching the app — the
    // app's auto-login (driven by userEmail/userPassword launch args)
    // hits /token/create at boot, so the stub must be available by
    // then. Canned sample data is set up here too so the FIRST sync
    // after login finds it.
    if (!global.mockCerdiServer) {
        await new Promise((resolve) => {
            global.mockCerdiServer = createMockCerdiServer(resolve);
        });
        global.mockCerdiServer.makeMockSample();
    }
    const { default: AppiumLauncher } = await import('../../build-utils/AppiumLauncher.js');
    global.launcher = new AppiumLauncher(opts.platform, { ...opts, launchArgs: launchArgs() });
    global.driver = await global.launcher.connect();
    if (opts.platform === 'android' && opts.isSimulator) {
        setAndroidLocation();
    }
    if (opts.platform === 'ios' && opts.isSimulator) {
        const appId = global.launcher.appId;
        const appPath = path.resolve(process.cwd(), 'builds/test-sim/Waterbug.app');
        // Wipe iOS keychain so iCloud-saved passwords from previous runs
        // don't trigger AutoFill prompts mid-test.
        try {
            execFileSync('xcrun', ['simctl', 'keychain', process.env.SIM_UDID, 'reset']);
        } catch (e) {
            console.warn(`[BeforeAll] simctl keychain reset failed: ${e.message}`);
        }
        // Disable iOS Password AutoFill globally so iOS doesn't prompt
        // "Save this Password?" after the login form submits — that sheet
        // races with the test's next tap and isn't a UIAlertController so
        // autoDismissAlerts can't catch it.
        try {
            execFileSync('xcrun', ['simctl', 'spawn', process.env.SIM_UDID,
                'defaults', 'write', 'com.apple.WebUIKit',
                'StoredCredentialsEnabled', '-bool', 'false']);
        } catch (e) {
            console.warn(`[BeforeAll] disabling AutoFill failed: ${e.message}`);
        }
        try { await global.driver.removeApp(appId); } catch (_) {}
        await global.driver.installApp(appPath);
        // Pre-grant location permission so the first-run native prompt
        // never appears — autoAcceptAlerts only handles JS dialogs, not
        // native iOS TCC prompts.
        const udid = process.env.SIM_UDID;
        try {
            // Grant `location` only — not `location-always`. The app
            // requests AUTHORIZATION_WHEN_IN_USE and Ti.Geolocation
            // refuses to lower an already-granted ALWAYS permission,
            // silently never starting the listener.
            execFileSync('xcrun', ['simctl', 'privacy', udid, 'grant', 'location', appId]);
        } catch (e) {
            console.warn(`[BeforeAll] simctl privacy failed: ${e.message}`);
        }
        // Reinstall leaves the app not running — activate it and wait for
        // foreground state before the first scenario tries to drive the UI.
        await global.launcher.launch(appId, launchArgs());
        for (let i = 0; i < 60; i++) {
            const state = await global.driver.execute('mobile: queryAppState', { bundleId: appId });
            if (state === 4) break;
            await new Promise(r => setTimeout(r, 500));
        }
        // Seed a simulated GPS fix after the app is running so
        // Ti.Geolocation's listener receives a location event. Setting
        // before launch can miss the initial event since the listener
        // isn't attached until SiteDetails opens.
        try {
            execFileSync('xcrun', ['simctl', 'location', udid, 'set', `${TEST_LAT},${TEST_LNG}`]);
        } catch (e) {
            console.warn(`[BeforeAll] simctl location failed: ${e.message}`);
        }
    }
});

Before(async function () {
    this.driver = global.driver;
    this.platform = global.platform;
    this.isSimulator = global.isSimulator;
    setUpWorld(this);
    if (!global.first) {
        // driver.reset() was removed in webdriverio v9 — restart the app
        // to get a clean state between scenarios.
        const appId = global.launcher.appId;
        await this.driver.terminateApp(appId);
        await global.launcher.launch(appId, launchArgs());
        // Wait until the app is actually in the foreground before
        // proceeding — activateApp can return before the UI is ready,
        // especially when WDA was started from a prebuilt cache.
        if (global.platform === 'ios') {
            for (let i = 0; i < 30; i++) {
                const state = await this.driver.execute('mobile: queryAppState', { bundleId: appId });
                if (state === 4) break;
                await new Promise(r => setTimeout(r, 500));
            }
        }
    } else {
        global.first = false;
    }
    // Nudge the simulated GPS fix every scenario so Ti.Geolocation's
    // listener (attached when SiteDetails opens) receives a fresh
    // location update. Setting the same coordinate twice still fires
    // location-manager updates, which is what we rely on.
    if (global.platform === 'ios' && process.env.SIM_UDID) {
        try {
            execFileSync('xcrun', ['simctl', 'location', process.env.SIM_UDID,
                'set', `${TEST_LAT},${TEST_LNG}`]);
        } catch (_) { /* best-effort */ }
    } else if (global.platform === 'android') {
        setAndroidLocation();
    }
});

AfterAll(async function () {
    if (global.launcher) await global.launcher.stop();
    if (global.mockCerdiServer) {
        global.mockCerdiServer.shutdown();
        global.mockCerdiServer = null;
    }
});