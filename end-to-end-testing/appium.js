var { expect } = require("chai");
const { setUpWorld, swipeRight } = require('../features/support/all-screens');

global.world = {};
global.expect = expect;
global.swipeRight = function(options) {
    swipeRight(world, options);
};

let launcher;

global.startAppium = async function() {
    this.timeout(600000);
    if (launcher) {
        // Reuse the existing session across describe blocks. webdriverio v9
        // removed driver.reset(), so suites share state until stopAppium runs.
        return;
    }
    const platform = process.env.PLATFORM;
    if (!platform) {
        throw new Error("Please set the PLATFORM environment variable");
    }
    const isSimulator = process.env.SIMULATOR === 'true';
    const host = process.env.HOST || 'local';
    const kobitonVersion = process.env.VERSION || null;
    const { default: AppiumLauncher } = await import('../build-utils/AppiumLauncher.js');
    launcher = new AppiumLauncher(platform, { isSimulator, host, kobitonVersion });
    // quick=true: connect to the already-installed app via bundleId — the
    // grunt end-to-end-test task installs+launches the app first.
    world.driver = await launcher.connect(true);
    world.platform = platform;
    setUpWorld(world);
};

global.stopAppium = async function() {
    // No-op — multi-suite runs share the session for performance.
};
