var { expect } = require("chai");
const { startAppiumClient, stopAppiumClient } = require('../features/support/appium');
const { setUpWorld, swipeRight } = require('../features/support/all-screens');

global.world = {};
global.expect = expect;
global.swipeRight = function() { swipeRight(world) };

beforeEach( async function() {
    if ( world.driver ) {
        await world.driver.reset();
    } else {
        let platform = process.env.PLATFORM;
        if ( ! platform )
            throw new Error("Please set the PLATFORM enviornment variable");
        world.driver = await startAppiumClient(platform,(process.env.QUICK==="true"?true:false));
        world.platform = platform;
        setUpWorld( world );
    }
})
after( async function() {
    //await stopAppiumClient(world.driver);
});