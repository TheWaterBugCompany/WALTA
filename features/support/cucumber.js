'use strict';
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const { startAppium, stopAppiumClient, getCapabilities } = require('./appium');
const { setUpWorld } = require('./all-screens');

// Device interactions are slow — 60s per step is the working baseline.
setDefaultTimeout(60 * 1000);

BeforeAll(async function () {
    const platform = process.env.PLATFORM;
    if (!platform) {
        throw new Error("Please set the PLATFORM environment variable");
    }
    const isSimulator = process.env.SIMULATOR === 'true';
    const host = process.env.HOST || 'local';
    // quick=true: connect to the already-installed app via bundleId rather
    // than reinstalling — the grunt acceptance-test task installs+launches
    // the app before invoking cucumber.
    const caps = await getCapabilities(platform, true, host, null, null, isSimulator);
    global.driver = await startAppium(caps, host);
    global.platform = platform;
    global.first = true;
});

Before(async function () {
    this.driver = global.driver;
    this.platform = global.platform;
    setUpWorld(this);
    if (!global.first) {
        await this.driver.reset();
    } else {
        global.first = false;
    }
});

AfterAll(async function () {
    if (global.driver) await stopAppiumClient(global.driver);
});