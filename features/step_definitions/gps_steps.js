'use strict';
const { Given } = require('@cucumber/cucumber');
const path = require('path');
const { execFileSync } = require('child_process');

// Melbourne CBD — arbitrary but plausible. Sample form requires a GPS
// lock before Done is enabled, so any scenario that taps Done needs
// this step before SiteDetails opens (Ti.Geolocation starts listening
// when SiteDetails opens; the emulator broadcasts its current fix to
// the new listener within ~1s of attach).
const TEST_LAT = -37.8136;
const TEST_LNG = 144.9631;

function adb() {
    return process.env.ANDROID_SDK_ROOT
        ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
        : 'adb';
}

function setLocationOnce(platform) {
    try {
        if (platform === 'android') {
            // adb emu geo fix takes lng,lat (opposite of simctl).
            execFileSync(adb(), ['emu', 'geo', 'fix', String(TEST_LNG), String(TEST_LAT)]);
        } else if (platform === 'ios' && process.env.SIM_UDID) {
            execFileSync('xcrun', ['simctl', 'location', process.env.SIM_UDID,
                'set', `${TEST_LAT},${TEST_LNG}`]);
        }
    } catch (e) { /* best-effort */ }
}

// Sets a GPS fix at a stable test location and re-broadcasts a few
// times to ensure the app's Ti.Geolocation listener — which only
// attaches when SiteDetails opens later in the scenario — catches an
// event regardless of the relative timing of "set" vs "attach".
Given('the GPS has a fix', {timeout: 10000}, async function () {
    for (let i = 0; i < 4; i++) {
        setLocationOnce(this.platform);
        await new Promise(r => setTimeout(r, 500));
    }
});
