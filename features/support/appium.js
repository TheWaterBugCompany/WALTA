const { remote } = require('webdriverio');
const http = require('http');
const _ = require('underscore');

function isAppiumRunning() {
    return new Promise((resolve) => {
        http.get('http://localhost:4723/status', () => resolve(true))
            .on('error', () => resolve(false));
    });
}

// All callers run against an app that the platform-specific launcher
// (IosSimulatorLauncher / AndroidEmulatorLauncher / IosLauncher / AndroidLauncher)
// has already installed and launched. Appium attaches to it via bundleId/appPackage —
// it never installs the app itself, hence noReset:true and autoLaunch:false everywhere.
async function getCapabilities(platform, simulator = false) {
    let caps = {};

    if (platform === "ios") {
        _(caps).extend({
            "appium:automationName": "XCUITest",
            "platformName": "iOS",
            "appium:autoAcceptAlerts": false,
            // WDA blocks each command until the app reports idle. The
            // out-of-process photo picker (PHPicker) never does, so a command
            // issued while it is up overruns newCommandTimeout (60s default) and
            // the session is reaped mid-scenario ("session is either terminated
            // or not started"). waitForQuiescence is ignored in xcuitest-driver
            // 11.x — waitForIdleTimeout is the honoured knob; 0 disables the
            // idle wait. newCommandTimeout 0 stops the reap outright (matches
            // Android).
            "appium:waitForQuiescence": false,
            "appium:waitForIdleTimeout": 0,
            "appium:newCommandTimeout": 0,
            "appium:useJSONSource": true,
            "appium:showXcodeLog": true,
            "appium:usePrebuiltWDA": false,
            "appium:bundleId": "net.thewaterbug.waterbug",
            "appium:noReset": true,
            "appium:autoLaunch": false,
            "appium:processArguments": { "args": ["-FIRDebugEnabled"] }
        });
        if (simulator) {
            // SIM_UDID identifies the simulator that IosSimulatorLauncher booted;
            // appium must attach to the same instance.
            if (!process.env.SIM_UDID) {
                throw new Error("SIM_UDID environment variable must be set for iOS simulator runs");
            }
            _(caps).extend({
                "appium:deviceName": "iPhone Simulator",
                "appium:udid": process.env.SIM_UDID,
            });
        } else {
            _(caps).extend({
                "appium:platformVersion": "12.4",
                "appium:deviceName": "The Code Sharman Test iPhone",
                "appium:udid": "auto",
                "appium:xcodeOrgId": "6RRED3LUUV",
                "appium:xcodeSigningId": "Apple Development",
            });
        }
    } else if (platform === "android") {
        _(caps).extend({
            "appium:automationName": "uiautomator2",
            "platformName": "Android",
            "appium:autoGrantPermissions": true,
            "appium:appActivity": ".WaterbugActivity",
            "appium:appWaitActivity": ".WaterbugActivity",
            "appium:newCommandTimeout": 0,
            "appium:appPackage": "net.thewaterbug.waterbug",
            "appium:noReset": true,
            "appium:autoLaunch": false,
            "appium:skipDeviceInitialization": false,
            "appium:skipServerInstallation": false,
        });
        if (simulator) {
            _(caps).extend({ "appium:avdName": "Medium_Phone_API_36.1" });
        }
    }
    return caps;
}

async function startAppium( caps ) {
    const driver = await remote({
        logLevel: 'error',
        hostname: 'localhost',
        port: 4723,
        capabilities: caps
    });
    process.once('SIGINT', () => {
        driver.deleteSession().catch(() => {}).finally(() => process.exit(0));
    });
    return driver;
}

async function stopAppiumClient(driver) {
    await driver.deleteSession()
}

module.exports.isAppiumRunning = isAppiumRunning;
module.exports.getCapabilities = getCapabilities;
module.exports.startAppium = startAppium;
module.exports.stopAppiumClient = stopAppiumClient;
