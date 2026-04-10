'use strict';
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
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
    const { default: AppiumLauncher } = await import('../../build-utils/AppiumLauncher.js');
    global.launcher = new AppiumLauncher(platform, { isSimulator, host });
    global.driver = await global.launcher.connect();
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
    if (global.launcher) await global.launcher.stop();
});