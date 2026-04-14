'use strict';
const { AfterAll, BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const { setUpWorld } = require('./all-screens');

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
    global.first = true;
});

Before(async function () {
    this.driver = global.driver;
    this.platform = global.platform;
    setUpWorld(this);
    if (!global.first) {
        // driver.reset() was removed in webdriverio v9 — restart the app
        // to get a clean state between scenarios.
        const appId = global.launcher.appId;
        await this.driver.terminateApp(appId);
        await this.driver.activateApp(appId);
    } else {
        global.first = false;
    }
});

AfterAll(async function () {
    if (global.launcher) await global.launcher.stop();
});