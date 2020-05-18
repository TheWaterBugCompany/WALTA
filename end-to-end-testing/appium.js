var { expect } = require("chai");
const { startAppiumClient, stopAppiumClient, getCapabilities } = require('../features/support/appium');
const { setUpWorld, swipeRight } = require('../features/support/all-screens');

global.world = {};
global.expect = expect;
global.swipeRight = function(options) { 
    swipeRight(world,options) 
};

global.startAppium = async function() {
    this.timeout(600000);
    if ( world.driver ) {
        await world.driver.reset();
    } else {
        let platform = process.env.PLATFORM, host = process.env.HOST;
        if ( ! platform )
            throw new Error("Please set the PLATFORM enviornment variable");
        world.driver = await startAppiumClient( getCapabilities( platform,true, host), host );
        world.platform = platform;
        setUpWorld( world );
    }
}

global.stopAppium = async function() {
   // await stopAppiumClient(global.world.driver);
}