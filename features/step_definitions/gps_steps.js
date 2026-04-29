'use strict';
const { Given, After } = require('@cucumber/cucumber');

// Melbourne CBD — arbitrary but plausible. The sample form requires a
// GPS lock before Done is enabled, so any scenario that taps Done
// needs this step.
const TEST_LAT = -37.8136;
const TEST_LNG = 144.9631;

// 1Hz mirrors a real GPS unit's update rate closely enough; iOS
// listeners that attach mid-scenario catch the next broadcast within
// a second.
const BROADCAST_INTERVAL_MS = 1000;

// Drives the simulator GPS as if it were a real GPS unit: continuous
// broadcasts at ~1Hz for the lifetime of the scenario. This decouples
// the test from the app-side listener-attach timing — Ti.Geolocation
// only attaches its listener when SiteDetails opens, but as long as
// the broadcaster is ticking, whenever attach happens the next event
// arrives within ~1s.
//
// The previous "set 4 times in a 10s window" loop was both a race
// (relied on at least one broadcast landing after attach) and a
// timeout flake (4× xcrun spawn cost on contended macOS runners
// could exceed the cucumber 10s step timeout). See WB-53.
async function startGpsBroadcaster(world, lat, lng) {
    if (world._gpsBroadcaster) return;
    const broadcaster = { stopped: false, timer: null };
    world._gpsBroadcaster = broadcaster;

    const tick = async () => {
        if (broadcaster.stopped) return;
        try {
            await global.launcher.setLocation(lat, lng);
        } catch (_) {
            // Best-effort. A failed simctl/adb call doesn't kill the
            // broadcaster — next tick may succeed once the simulator
            // is less contended.
        }
        if (!broadcaster.stopped) {
            broadcaster.timer = setTimeout(tick, BROADCAST_INTERVAL_MS);
        }
    };

    // Await the first broadcast so the step doesn't return until at
    // least one location has been pushed to the simulator.
    await tick();
}

function stopGpsBroadcaster(world) {
    const broadcaster = world._gpsBroadcaster;
    if (!broadcaster) return;
    broadcaster.stopped = true;
    if (broadcaster.timer) clearTimeout(broadcaster.timer);
    world._gpsBroadcaster = null;
}

Given('the GPS has a fix', async function () {
    await startGpsBroadcaster(this, TEST_LAT, TEST_LNG);
});

After(function () {
    stopGpsBroadcaster(this);
});
