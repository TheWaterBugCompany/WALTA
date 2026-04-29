'use strict';
const { Given } = require('@cucumber/cucumber');

// Melbourne CBD — arbitrary but plausible. Sample form requires a GPS
// lock before Done is enabled, so any scenario that taps Done needs
// this step before SiteDetails opens (Ti.Geolocation starts listening
// when SiteDetails opens; the emulator broadcasts its current fix to
// the new listener within ~1s of attach).
const TEST_LAT = -37.8136;
const TEST_LNG = 144.9631;

// Sets a GPS fix at a stable test location and re-broadcasts a few
// times to ensure the app's Ti.Geolocation listener — which only
// attaches when SiteDetails opens later in the scenario — catches an
// event regardless of the relative timing of "set" vs "attach".
Given('the GPS has a fix', {timeout: 10000}, async function () {
    for (let i = 0; i < 4; i++) {
        try { await global.launcher.setLocation(TEST_LAT, TEST_LNG); }
        catch (_) { /* best-effort */ }
        await new Promise(r => setTimeout(r, 500));
    }
});
