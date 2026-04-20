'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');

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

// AppiumLauncher.connect() can take several minutes on iOS when WebDriverAgent
// is built from source on a cold runner — give the hook generous headroom.
BeforeAll({ timeout: 600 * 1000 }, async function () {
    const opts = JSON.parse(process.env.APPIUM_OPTIONS || '{}');
    if (!opts.platform) {
        throw new Error("APPIUM_OPTIONS must include 'platform'");
    }
    const { default: AppiumLauncher } = await import('../../build-utils/AppiumLauncher.js');
    global.launcher = new AppiumLauncher(opts.platform, opts);
    global.driver = await global.launcher.connect();
    global.platform = opts.platform;
    global.isSimulator = !!opts.isSimulator;
    global.first = true;
    // Wipe app state (sqlite DB, filesystem, etc.) so each acceptance run
    // starts from a clean slate. Appium's noReset:true keeps the app
    // installed across sessions; without this, taxa from a previous run
    // accumulate in the sample tray.
    if (opts.platform === 'android' && opts.isSimulator) {
        // `adb shell pm clear` wipes the app's SQLite DB, shared prefs,
        // and filesystem — equivalent of the iOS remove+install dance
        // but far quicker since it keeps the APK installed. pm clear
        // also resets TCC permission grants and stops the app, so
        // re-grant location and relaunch after.
        const appId = global.launcher.appId;
        try {
            execFileSync(adb(), ['shell', 'pm', 'clear', appId]);
            execFileSync(adb(), ['shell', 'pm', 'grant', appId, 'android.permission.ACCESS_FINE_LOCATION']);
            execFileSync(adb(), ['shell', 'pm', 'grant', appId, 'android.permission.ACCESS_COARSE_LOCATION']);
        } catch (e) {
            console.warn(`[BeforeAll] adb pm clear/grant failed: ${e.message}`);
        }
        await global.driver.activateApp(appId);
    }
    if (opts.platform === 'ios' && opts.isSimulator) {
        const appId = global.launcher.appId;
        const appPath = path.resolve(process.cwd(), 'builds/test-sim/Waterbug.app');
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
        await global.driver.activateApp(appId);
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
        await this.driver.activateApp(appId);
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
});