'use strict';
const { AfterAll, BeforeAll, Before } = require('cucumber');
const { startAppiumClient, stopAppiumClient } = require('./appium');
const { setUpWorld } = require('./all-screens');
const {setDefaultTimeout} = require('cucumber');
setDefaultTimeout(30 * 1000);

BeforeAll( {timeout: 99999*1000}, async function() {
    let platform = "android";
    console.info( process.platform );
    if ( process.platform === "darwin" ) {
        platform = "ios";
    }
    let driver =  await startAppiumClient(platform, true); 
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
    if ( global.driver )
        await stopAppiumClient( global.driver );
});