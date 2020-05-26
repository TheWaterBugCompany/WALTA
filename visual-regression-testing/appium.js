const { expect } = require("chai");
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
        let platform = process.env.PLATFORM, host = process.env.HOST, version = process.env.VERSION;
        let [ width, height ] = process.env.RES.split("x");
        if ( ! platform )
            throw new Error("Please set the PLATFORM enviornment variable");
        
        var caps = await getCapabilities( platform,true,host,version,{ width: parseInt(width), height: parseInt(height) });
        if ( caps.deviceName ) {
            caps.sessionDescription = `Visual regression test suite ${process.env.RES}`;
            console.info(`${caps.sessionDescription}\nRunning on device: ${caps.deviceName} (${platform})\n`);
            var session = await startAppiumClient( caps, host );
            world.driver = session; ;
            world.platform = platform;
            setUpWorld( world );
        } else {
            await new Promise( (resolve) => setTimeout(resolve, 5000 ) ); // wait 5 seconds before retrying
            throw new Error(`Unable to find device for ${width}x${height} resolution`)
        }
    }
}

global.stopAppium = async function() {
    if ( world.driver ) {
        await stopAppiumClient(world.driver);
    }
}