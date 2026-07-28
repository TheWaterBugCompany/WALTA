'use strict';
const { AfterAll, BeforeAll, Before, After, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');
const { startMockServer, connectAndPrepareApp, resetApp, recoverSessionIfDead, sessionIsAlive, teardown } = require('./appium-world');
const { markerLine } = require('./infra-failure-marker');
const { isEnvironmentalFailure } = require('./environmental-failures');

// Device interactions are slow, and contested CI runners run ~2x slower
// (Android acceptance: ~5min off-peak vs ~9min at 10-15 UTC peak), so give
// each step a generous budget so slow-but-fine steps don't self-kill.
setDefaultTimeout(120 * 1000);

// connect() can take minutes on iOS when WebDriverAgent builds from source.
BeforeAll({ timeout: 600 * 1000 }, async function () {
    const opts = JSON.parse(process.env.APPIUM_OPTIONS || '{}');
    if (!opts.platform) {
        throw new Error("APPIUM_OPTIONS must include 'platform'");
    }
    global.first = true;
    await startMockServer();
    await connectAndPrepareApp({ platform: opts.platform, isSimulator: !!opts.isSimulator });
});

Before(async function () {
    // Rebuild the session first if a prior scenario's run dropped it, so one
    // dead session doesn't cascade into every remaining scenario (WB-149).
    const reconnected = await recoverSessionIfDead();
    this.driver = global.driver;
    this.platform = global.platform;
    this.isSimulator = global.isSimulator;
    setUpWorld(this);
    if (global.first) {
        global.first = false;
    } else if (!reconnected) {
        // A reconnected app is freshly launched and already at a clean start;
        // only the reuse path needs the in-app reset.
        await resetApp();
    }
});

After(async function (scenario) {
    // Classify a failure by its cause: if the session is dead the scenario was
    // killed by an infra collapse (contended runner dropped WDA), not a real
    // defect. Emit a marker so CucumberLauncher can re-run just these on a
    // fresh session, while genuine failures (session still alive) are left to
    // fail. This replaces the hard-coded @gallery retry with cause-based
    // handling that covers any scenario (WB-200).
    if (scenario.result?.status !== Status.FAILED) return;
    if (!(await sessionIsAlive())) {
        // Contended runner dropped the session — a fresh session fixes it.
        console.log(markerLine(scenario.pickle.name, "session-dead"));
    } else if (isEnvironmentalFailure(scenario.result.message)) {
        // Session's alive but a known emulator/environment wait timed out
        // (slow GPS fix, sample tray not settled) — only a fresh device fixes
        // it, so mark it so CucumberLauncher escalates to a fresh-device retry.
        console.log(markerLine(scenario.pickle.name, "environmental"));
    }
});

AfterAll(async function () {
    await teardown();
});
