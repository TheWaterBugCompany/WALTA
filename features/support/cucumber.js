'use strict';
const { After, Before } = require('cucumber');
const { startAppiumClient, stopAppiumClient } = require('./appium');
const { setUpWorld } = require('./all-screens');
Before( {timeout: 60*1000}, async function() {
    this.driver = await startAppiumClient(); 
    setUpWorld( this );
});
After( async function() {
    stopAppiumClient( this.driver );
});