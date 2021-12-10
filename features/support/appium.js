const { remote } = require('webdriverio');
const { join } = require('path');
const _ = require('underscore');
const KobitonAPI = require("./kobiton");


async function  getCapabilities( platform, quick, host = 'local', kobitonVersion = null, deviceResolution = null ) {
    let caps = {};
     if ( host === "kobiton") {
        _(caps).extend({
            // The generated session will be visible to you only. 
            sessionName:        'Automation test session',
            sessionDescription: '',
            //deviceOrientation:  'landscape',
            captureScreenshots: true,
            browserName:        'chrome',
            deviceGroup:        'KOBITON',
            app: `kobiton-store:v${kobitonVersion}`
          });

          if ( platform === "android" ) {
            _(caps).extend({
                autoGrantPermissions: true,
                platformName:       'Android'
            });
          } else if ( platform === "ios" ) {
            _(caps).extend({
                platformName:       'iOS'
            });
        }

        if ( deviceResolution ) {
            var kb = new KobitonAPI("thecodesharman","acbea4cd-f259-42bc-9f75-ad25f9cfec5c");
            var devices = await kb.getAvailableDevicesByResolution(platform,deviceResolution.width,deviceResolution.height);
            if ( devices.length > 0 ) {
                _(caps).extend({
                    platformVersion: '*',
                    deviceName: devices[0].deviceName
                });
            }
        } else {
            _(caps).extend({
                platformVersion: '*',
                deviceName: '*'
            })
        }
     } else if ( platform === "ios" ) {
        _(caps).extend({
            automationName: "XCUITest",
            platformName: "iOS",
            autoAcceptAlerts: false,
            waitForQuiescence: false,
            skipLogCapture: true,
            platformVersion: "12.4",
            deviceName: "The Code Sharman Test iPhone",
            udid: "auto",
            //xcodeOrgId: "6RRED3LUUV",
            //xcodeSigningId: "Apple Developer",
            useJSONSource: true,
            realDeviceLogger: `./node_modules/deviceconsole/deviceconsole`,
            showXcodeLog: true,
            usePrebuiltWDA: false,
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
            /* TODO: read key from non published file*/
            key: '<<<SECRET>>>',
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
