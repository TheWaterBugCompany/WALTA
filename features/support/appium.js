const { remote } = require('webdriverio');
const { join } = require('path');
async function startAppiumClient() {
        return await remote({
            logLevel: 'error',
            hostname: 'localhost',
            port: 4723, 
            capabilities: {
                automationName: "uiautomator2",
                platformName: "Android",
                avd: 'HDPI',
                deviceName: "Android Emulator",
                app: join(process.cwd(), './walta-app/build/android/bin/Waterbug.apk'),
                appWaitActivity: 'org.appcelerator.titanium.TiActivity'
            }
        });
}

async function stopAppiumClient(driver) {
    await driver.deleteSession()
}
module.exports.startAppiumClient = startAppiumClient;
module.exports.stopAppiumClient = stopAppiumClient;
