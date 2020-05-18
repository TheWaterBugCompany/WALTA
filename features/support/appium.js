const { remote } = require('webdriverio');
const { join } = require('path');
const _ = require('underscore');


function getCapabilities( platform, quick, host = 'local' ) {
    let caps = {};
     if ( host === "kobiton") {
        _(caps).extend({
            // The generated session will be visible to you only. 
            sessionName:        'Automation test session',
            sessionDescription: '',
            deviceOrientation:  'landscape',
            captureScreenshots: true,
            browserName:        'chrome',
            deviceGroup:        'KOBITON',
            app: 'kobiton-store:59235'
          });

          if ( platform === "android" ) {
            _(caps).extend({
                autoGrantPermissions: true,
                deviceName:         '*',
                platformVersion:    '*',
                platformName:       'Android'
            });
          }

     } else if ( platform === "ios" ) {
        _(caps).extend({
            automationName: "XCUITest",
            platformName: "iOS",
            autoAcceptAlerts: true,
            waitForQuiescence: false,
            skipLogCapture: true,
            platformVersion: "12.4",
            deviceName: "The Code Sharman Test iPhone",
            udid: "auto",
            xcodeOrgId: "ZG6HRCUR8Q",
            xcodeSigningId: "iPhone Developer",
            useJSONSource: true,
            realDeviceLogger: `./node_modules/deviceconsole/deviceconsole`,
            showXcodeLog: true,
            usePrebuiltWDA: true,
            noReset: false,
            processArguments: {
                "args": [
                    "-FIRDebugEnabled"
                ]
            }
        });
        if ( !quick ) {
            caps.app = join(process.cwd(), './builds/test/Waterbug.ipa');
        } else {
            _(caps).extend({
                bundleId: "net.thewaterbug.waterbug"
            });
        }
     } else if ( platform === "android") {
        _(caps).extend({
            automationName: "uiautomator2",
            platformName: "Android",
            autoGrantPermissions: true,
            deviceName: "device",
            appActivity: ".WaterbugActivity",
            //appWaitActivity: ".WaterbugActivity",
            newCommandTimeout: 0
        });
        if ( !quick ) {
            caps.app = join(process.cwd(), './builds/test/Waterbug.apk');
        } else {
            _(caps).extend({
                appPackage: "net.thewaterbug.waterbug",
                skipDeviceInitialization: false,
                skipServerInstallation: false,
                ignoreUnimportantViews: true
            });
        }
    } 
    return caps;
}

async function startAppiumClient( caps, host = 'local' ) {
    if ( host === 'kobiton' ) {
        return await remote({
            protocol: 'https',
            port: 443,
            hostname: 'api.kobiton.com',
            user: 'thecodesharman',
            key: 'acbea4cd-f259-42bc-9f75-ad25f9cfec5c',
            capabilities: caps,
            logLevel: 'error'
        });
    } else {
        return await remote({
            logLevel: 'error',
            hostname: 'localhost',
            port: 4723, 
            capabilities: caps
        });
    }
}

async function stopAppiumClient(driver) {
    await driver.deleteSession()
}

module.exports.getCapabilities = getCapabilities;
module.exports.startAppiumClient = startAppiumClient;
module.exports.stopAppiumClient = stopAppiumClient;
