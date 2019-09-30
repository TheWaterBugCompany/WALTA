const { remote } = require('webdriverio');
const { join } = require('path');
const _ = require('underscore');


function getCapabilities( platform, quick ) {
    let caps = {};
     if ( platform === "android") {
        _(caps).extend({
            automationName: "uiautomator2",
            platformName: "Android",
            autoGrantPermissions: true,
            deviceName: "device",
            appActivity: ".WaterbugActivity",
            appWaitActivity: "org.appcelerator.titanium.TiActivity"
        });
        if ( !quick ) {
            caps.app = join(process.cwd(), './builds/test/Waterbug.apk');
        } else {
            _(caps).extend({
                appPackage: "net.thewaterbug.waterbug",
                skipDeviceInitialization: true,
                skipServerInstallation: true,
                ignoreUnimportantViews: true
            });
        }
    } else {
        _(caps).extend({
            automationName: "XCUITest",
            platformName: "iOS",
            platformVersion: "12.4",
            autoAcceptAlerts: true,
            deviceName: "The Code Sharman Test iPhone",
            udid: "auto",
            xcodeOrgId: "ZG6HRCUR8Q",
            xcodeSigningId: "iPhone Developer",
            useJSONSource: true,
            waitForQuiescence: false,
            skipLogCapture: true,
            realDeviceLogger: `./node_modules/deviceconsole/deviceconsole`,
            showXcodeLog: true,
            usePrebuiltWDA: true,
            noReset: false
        });
        if ( !quick ) {
            caps.app = join(process.cwd(), './builds/test/Waterbug.ipa');
        } else {
            _(caps).extend({
                bundleId: "net.thewaterbug.waterbug"
            });
        }
    }
    return caps;
}

async function startAppiumClient( caps ) {
    return await remote({
        logLevel: 'error',
        hostname: 'localhost',
        port: 4723, 
        capabilities: caps
    });
}

async function stopAppiumClient(driver) {
    await driver.deleteSession()
}

module.exports.getCapabilities = getCapabilities;
module.exports.startAppiumClient = startAppiumClient;
module.exports.stopAppiumClient = stopAppiumClient;
