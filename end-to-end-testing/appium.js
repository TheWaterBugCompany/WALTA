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
        let platform = "android";
        if ( process.platform === "darwin" ) {
            platform = "ios";
        }
        world.driver = await startAppiumClient(platform,true);
        world.platform = platform;
        setUpWorld( world );
    }
})
after( async function() {
    await stopAppiumClient(world.driver);
});