'use strict';
// Mocha root hooks for the end-to-end suite — see docs/testing.md.
const { expect } = require('chai');
const { setUpWorld } = require('../features/support/all-screens');
const { startMockServer, connectAndPrepareApp, resetApp, teardown } = require('../features/support/appium-world');
const { captureFailure } = require('./capture-failure');

global.world = {};
global.expect = expect;
global.swipeRight = function (options) { global.world.swipeRight(global.world, options); };

// No-op shims: the root hooks own connect/teardown; legacy specs still call these.
global.startAppium = async function () {};
global.stopAppium = async function () {};

const ARTIFACTS_ROOT = '/tmp/acceptance-artifacts';

before(async function () {
    this.timeout(600000);
    const platform = process.env.PLATFORM;
    if (!platform) throw new Error("Please set the PLATFORM environment variable");
    const isSimulator = process.env.SIMULATOR === 'true';
    global.first = true;
    await startMockServer();
    await connectAndPrepareApp({ platform, isSimulator });
    global.world.driver = global.driver;
    global.world.platform = global.platform;
    global.world.isSimulator = global.isSimulator;
    setUpWorld(global.world);
});

beforeEach(async function () {
    this.timeout(120000);
    if (global.first) {
        global.first = false;
        return;
    }
    await resetApp();
});

afterEach(async function () {
    this.timeout(120000);
    if (!this.currentTest || this.currentTest.state !== 'failed') return;
    try {
        await captureFailure({
            driver: global.driver,
            platform: global.platform,
            title: this.currentTest.title,
            root: ARTIFACTS_ROOT,
        });
    } catch (e) {
        console.warn(`[e2e] captureFailure failed: ${e && e.message}`);
    }
});

after(async function () {
    this.timeout(60000);
    await teardown();
});
