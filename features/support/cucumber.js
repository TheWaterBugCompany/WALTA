'use strict';
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');
const { startMockServer, connectAndPrepareApp, resetApp, teardown } = require('./appium-world');

// Device interactions are slow — 60s per step is the working baseline.
setDefaultTimeout(60 * 1000);

// AppiumLauncher.connect() can take several minutes on iOS when WebDriverAgent
// is built from source on a cold runner — give the hook generous headroom.
BeforeAll({ timeout: 600 * 1000 }, async function () {
    const opts = JSON.parse(process.env.APPIUM_OPTIONS || '{}');
    if (!opts.platform) {
        throw new Error("APPIUM_OPTIONS must include 'platform'");
    }
    global.first = true;
    await startMockServer();
    await connectAndPrepareApp({ platform: opts.platform, isSimulator: !!opts.isSimulator });
    // GPS fix is set by the explicit `Given the GPS has a fix` step in
    // scenarios that need one (see step_definitions/gps_steps.js).
});

Before(async function () {
    this.driver = global.driver;
    this.platform = global.platform;
    this.isSimulator = global.isSimulator;
    setUpWorld(this);
    if (!global.first) {
        await resetApp();
    } else {
        global.first = false;
    }
});

AfterAll(async function () {
    await teardown();
});
