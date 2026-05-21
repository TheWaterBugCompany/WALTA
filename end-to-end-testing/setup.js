'use strict';
// Mocha root hooks for the end-to-end suite. Reuses the same Appium
// orchestration as the cucumber acceptance suite (features/support/appium-world).
// Loaded first by the grunt `end-to-end-test` task so its root-level
// before/beforeEach/after register before any *-test.js spec runs.
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { setUpWorld } = require('../features/support/all-screens');
const { startMockServer, connectAndPrepareApp, resetApp, teardown } = require('../features/support/appium-world');

global.world = {};
global.expect = expect;
global.swipeRight = function (options) { global.world.swipeRight(global.world, options); };

// Back-compat shims: legacy specs (back-button-test.js) call these in their
// own before/after hooks. The root hooks below now own connect/teardown, so
// these are no-ops.
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
    // Skip the reset before the first test — the app was just launched fresh.
    if (global.first) {
        global.first = false;
        return;
    }
    await resetApp();
});

afterEach(async function () {
    if (!this.currentTest || this.currentTest.state !== 'failed') return;
    await captureFailure(this.currentTest.title);
});

after(async function () {
    this.timeout(60000);
    await teardown();
});

async function captureFailure(title) {
    try {
        const slug = title.replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 80);
        const dir = path.join(ARTIFACTS_ROOT, slug);
        fs.mkdirSync(dir, { recursive: true });
        try {
            const png = await global.driver.takeScreenshot();
            fs.writeFileSync(path.join(dir, 'screenshot.png'), png, 'base64');
        } catch (e) {
            fs.writeFileSync(path.join(dir, 'screenshot.error.txt'), String(e && e.message));
        }
        try {
            const src = await global.driver.getPageSource();
            fs.writeFileSync(path.join(dir, 'page-source.xml'), src);
        } catch (e) {
            fs.writeFileSync(path.join(dir, 'page-source.error.txt'), String(e && e.message));
        }
    } catch (e) {
        // diagnostics are best-effort; never mask the real test failure
        console.warn(`[e2e] captureFailure failed: ${e && e.message}`);
    }
}
