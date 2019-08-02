'use strict';
const { AfterAll, BeforeAll, Before } = require('cucumber');
const { startAppiumClient, stopAppiumClient } = require('./appium');
const { setUpWorld } = require('./all-screens');
const {setDefaultTimeout} = require('cucumber');
setDefaultTimeout(30 * 1000);

BeforeAll( {timeout: 120*1000}, async function() {
    let driver =  await startAppiumClient(); 
    global.driver = driver;
    global.first = true;
});

Before(  {timeout: 120*1000}, async function() {
    this.driver = global.driver;
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