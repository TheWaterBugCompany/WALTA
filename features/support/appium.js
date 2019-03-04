'use strict';

var { After, Before } = require('cucumber');


const { remote } = require('webdriverio');
const { join } = require('path');

const LoginScreen = require('./login_screen');
const MenuScreen = require('./menu_screen');


Before( {timeout: 60*1000}, startAppiumClient );
After( stopAppiumClient );

 async function startAppiumClient() {
        const driver = await remote({
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
        })

        this.driver = driver; 
        this.login = new LoginScreen( this );
        this.menu = new MenuScreen( this );

}

async function stopAppiumClient() {
    await this.driver.deleteSession()
}
