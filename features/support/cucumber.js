'use strict';
const { AfterAll, BeforeAll, Before, After, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');
const { startMockServer, connectAndPrepareApp, resetApp, recoverSessionIfDead, sessionIsAlive, teardown } = require('./appium-world');
const { markerLine } = require('./infra-failure-marker');
const { classifyInfraFailure } = require('./classify-infra-failure');

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
    // Track completion so the After hook can tell an app-launch failure (this
    // hook timed out relaunching a wedged/slow cold-start on a contended runner)
    // from a failure in the scenario body — the former needs a fresh DEVICE, not
    // just a fresh session (see classify-infra-failure.js).
    global.beforeHookCompleted = false;
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
    global.beforeHookCompleted = true;
});

After(async function (scenario) {
    // Classify a failure by its cause so CucumberLauncher can pick the right
    // recovery: a fresh-DEVICE reboot for an app-launch failure or a known
    // emulator/environment wait, a cheap fresh-SESSION re-run for a dropped
    // session, and nothing (stays red, never retried) for a genuine defect.
    // Cause-based handling covers any scenario (WB-200/WB-203).
    if (scenario.result?.status !== Status.FAILED) return;
    const reason = await classifyInfraFailure({
        beforeHookCompleted: global.beforeHookCompleted,
        message: scenario.result.message,
        sessionAlive: sessionIsAlive,
    });
    if (reason) console.log(markerLine(scenario.pickle.name, reason));
});

AfterAll(async function () {
    await teardown();
});
