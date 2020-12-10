'use strict';
const { AfterAll, BeforeAll, Before } = require('cucumber');
const { startAppiumClient, stopAppiumClient, getCapabilities } = require('./appium');
const { setUpWorld } = require('./all-screens');
const {setDefaultTimeout} = require('cucumber');
setDefaultTimeout(2000);

BeforeAll( async function() {
    /*let platform = process.env.PLATFORM;
    let caps = await getCapabilities( platform, true )
    if ( ! platform )
        throw new Error("Please set the PLATFORM enviornment variable");
    let driver =  await startAppiumClient(caps); 
    global.driver = driver;
    global.platform = platform;*/
    global.first = true;
});

Before( async function() {
    this.driver = global.appium_session;
    this.platform = global.platform;
    setUpWorld( this );
    if ( !global.first ) {
        await this.driver.reset();
    } else {
        global.first = false;
    }
});

AfterAll( async function() {
    //if ( global.driver ) await stopAppiumClient( global.driver );
});