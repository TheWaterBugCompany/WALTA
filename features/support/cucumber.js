'use strict';
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');
const { startMockServer, connectAndPrepareApp, resetApp, teardown } = require('./appium-world');

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
