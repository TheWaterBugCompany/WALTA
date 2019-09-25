var { expect } = require("chai");
const { startAppiumClient, stopAppiumClient, getCapabilities } = require('../features/support/appium');
const { setUpWorld, swipeRight } = require('../features/support/all-screens');

global.world = {};
global.expect = expect;
global.swipeRight = function(options) { swipeRight(world,options) };

global.startAppium = async function() {
    if ( world.driver ) {
        await world.driver.reset();
    } else {
        let platform = process.env.PLATFORM;
        if ( ! platform )
            throw new Error("Please set the PLATFORM enviornment variable");
        world.driver = await startAppiumClient( getCapabilities( platform,true) );
        world.platform = platform;
        setUpWorld( world );
    }
}

global.stopAppium = async function() {
    //await stopAppiumClient(world.driver);
}