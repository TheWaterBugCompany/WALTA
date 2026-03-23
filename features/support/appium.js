const { remote } = require('webdriverio');
const { join } = require('path');
const http = require('http');
const _ = require('underscore');
const KobitonAPI = require("./kobiton");

function isAppiumRunning() {
    return new Promise((resolve) => {
        http.get('http://localhost:4723/status', () => resolve(true))
            .on('error', () => resolve(false));
    });
}


async function  getCapabilities( platform, quick, host = 'local', kobitonVersion = null, deviceResolution = null, simulator = false ) {
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
            "appium:automationName": "XCUITest",
            "platformName": "iOS",
            "appium:autoAcceptAlerts": false,
            "appium:waitForQuiescence": false,
            "appium:useJSONSource": true,
            "appium:showXcodeLog": true,
            "appium:usePrebuiltWDA": false,
            "appium:noReset": false,
            "appium:processArguments": {
                "args": [
                    "-FIRDebugEnabled"
                ]
            }
        });
        if ( simulator ) {
            _(caps).extend({
                "appium:deviceName": "iPhone 17 Pro",
                "appium:udid": "8A665EBC-2A48-4965-A1B6-E52A289C9744",
            });
            if ( !quick ) {
                _(caps).extend({ "appium:app": join(process.cwd(), './builds/unit-test/Waterbug.app') });
            } else {
                _(caps).extend({
                    "appium:bundleId": "net.thewaterbug.waterbug"
                });
            }
        } else {
            _(caps).extend({
                "appium:platformVersion": "12.4",
                "appium:deviceName": "The Code Sharman Test iPhone",
                "appium:udid": "auto",
                "appium:xcodeOrgId": "6RRED3LUUV",
                "appium:xcodeSigningId": "Apple Development",
            });
            if ( !quick ) {
                _(caps).extend({ "appium:app": join(process.cwd(), './builds/test/Waterbug.ipa') });
            } else {
                _(caps).extend({
                    "appium:bundleId": "net.thewaterbug.waterbug"
                });
            }
        }
     } else if ( platform === "android") {
        _(caps).extend({
            "appium:automationName": "uiautomator2",
            "platformName": "Android",
            "appium:autoGrantPermissions": true,
            "appium:appActivity": ".WaterbugActivity",
            "appium:appWaitActivity": ".WaterbugActivity",
            "appium:newCommandTimeout": 0
        });
        if ( simulator ) {
            _(caps).extend({
                "appium:avdName": "Medium_Phone_API_36.1",
                "appium:fullReset": true,
            });
            if ( !quick ) {
                _(caps).extend({ "appium:app": join(process.cwd(), './walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk') });
            } else {
                _(caps).extend({
                    "appium:appPackage": "net.thewaterbug.waterbug",
                    "appium:skipDeviceInitialization": false,
                    "appium:skipServerInstallation": false,
                });
            }
        } else {
            if ( !quick ) {
                _(caps).extend({ "appium:app": join(process.cwd(), './builds/test/Waterbug.apk') });
            } else {
                _(caps).extend({
                    "appium:appPackage": "net.thewaterbug.waterbug",
                    "appium:skipDeviceInitialization": false,
                    "appium:skipServerInstallation": false,
                });
            }
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
