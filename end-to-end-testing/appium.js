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
        world.driver = await startAppiumClient(false);
        setUpWorld( world );
    }
})
after( async function() {
    await stopAppiumClient(world.driver);
});