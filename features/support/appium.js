const { remote } = require('webdriverio');
const http = require('http');
const _ = require('underscore');
const KobitonAPI = require("./kobiton");

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
async function getCapabilities(platform, host = 'local', kobitonVersion = null, deviceResolution = null, simulator = false) {
    let caps = {};

    if (host === "kobiton") {
        _(caps).extend({
            sessionName:        'Automation test session',
            sessionDescription: '',
            captureScreenshots: true,
            browserName:        'chrome',
            deviceGroup:        'KOBITON',
            app: `kobiton-store:v${kobitonVersion}`
        });

        if (platform === "android") {
            _(caps).extend({ autoGrantPermissions: true, platformName: 'Android' });
        } else if (platform === "ios") {
            _(caps).extend({ platformName: 'iOS' });
        }

        if (deviceResolution) {
            const kb = new KobitonAPI("thecodesharman", "acbea4cd-f259-42bc-9f75-ad25f9cfec5c");
            const devices = await kb.getAvailableDevicesByResolution(platform, deviceResolution.width, deviceResolution.height);
            if (devices.length > 0) {
                _(caps).extend({ platformVersion: '*', deviceName: devices[0].deviceName });
            }
        } else {
            _(caps).extend({ platformVersion: '*', deviceName: '*' });
        }
        return caps;
    }

    if (platform === "ios") {
        _(caps).extend({
            "appium:automationName": "XCUITest",
            "platformName": "iOS",
            "appium:autoAcceptAlerts": false,
            "appium:waitForQuiescence": false,
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

async function startAppium( caps, host = 'local' ) {
    let driver;
    if ( host === 'kobiton' ) {
        driver = await remote({
            protocol: 'https',
            port: 443,
            hostname: 'api.kobiton.com',
            user: 'thecodesharman',
            /* TODO: read key from non published file*/
            key: '<<<SECRET>>>',
            capabilities: caps,
            logLevel: 'error'
        });
    } else {
        driver = await remote({
            logLevel: 'error',
            hostname: 'localhost',
            port: 4723,
            capabilities: caps
        });
    }
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
