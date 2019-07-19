var { expect } = require("chai");
const { startAppiumClient, stopAppiumClient } = require('../features/support/appium');
const { setUpWorld } = require('../features/support/all-screens');

global.world = {};
global.expect = expect;
global.swipeRight = swipeRight;

async function swipeRight() {
    await world.driver.touchPerform([ 
        {action: 'press', options: {x: 44, y: 214}},
        {action: 'wait', options:{ ms: 500 } },
        {action: 'moveTo', options: {x: 700, y: 214}},
        {action:'release'}]);
}
before( async function() {
    let driver = await startAppiumClient();
    world.driver = driver;
    setUpWorld( world );
});
beforeEach( async function() {
    await world.driver.reset();
})
after( async function() {
    await stopAppiumClient(world.driver);
});