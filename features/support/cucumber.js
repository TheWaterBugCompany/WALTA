'use strict';
const { AfterAll, BeforeAll, Before } = require('cucumber');
const { startAppiumClient, stopAppiumClient } = require('./appium');
const { setUpWorld } = require('./all-screens');
const {setDefaultTimeout} = require('cucumber');
setDefaultTimeout(30 * 1000);

BeforeAll( {timeout: 99999*1000}, async function() {
    let platform = process.env.PLATFORM;
    if ( ! platform )
        throw new Error("Please set the PLATFORM enviornment variable");
    let driver =  await startAppiumClient(platform, (process.env.QUICK==="true"?true:false)); 
    global.driver = driver;
    global.platform = platform;
    global.first = true;
});

Before(  {timeout: 120*1000}, async function() {
    this.driver = global.driver;
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