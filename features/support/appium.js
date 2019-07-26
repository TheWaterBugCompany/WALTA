const { remote } = require('webdriverio');
const { join } = require('path');
async function startAppiumClient(quick=false) {
    let caps = {
        automationName: "uiautomator2",
        platformName: "Android",
        avd: "HDPI",
        deviceName: "Android Emulator",
        appActivity: ".WaterbugActivity",
        appWaitActivity: "org.appcelerator.titanium.TiActivity"
    };
    if ( !quick ) {
        caps.app = join(process.cwd(), './walta-app/build/android/bin/Waterbug.apk');
    } else {
        caps.appPackage = "net.thewaterbug.waterbug";
        caps.skipDeviceInitialization = true;
        caps.skipServerInstallation = true;
        caps.ignoreUnimportantViews = true;
    }
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
module.exports.startAppiumClient = startAppiumClient;
module.exports.stopAppiumClient = stopAppiumClient;
