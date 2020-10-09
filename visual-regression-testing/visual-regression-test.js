var fs = require('fs');
var sizeOf = require('image-size');

const { navigateGoBack,
    navigateBrowseViaTray,
    navigateSpeedbugNotSureViaTray, 
    navigateSpeedbugViaTray, 
    navigateKeyViaIdentify, 
    navigateBrowseViaIdentify, 
    navigateSpeedbugViaIdentify, 
    navigateSpeedbugNotSureViaIdentify,
    navigateTakePhoto } = require('../features/support/navigation-driver');

const assertLooksSame = require('../features/support/image-test');

function screenshotPath( screenshot, name, postfix="" ) {
    var dims = sizeOf(screenshot);
    return `${__dirname}/baseline-images/${name.replace(/ /g,"_")}_${dims.width}x${dims.height}${postfix.length > 0 ?"_"+postfix:""}.png`;
}

// todo: collect failures to report at the end of the run, currently one failure causes that test
// to stop execution, thus causing future tests to fail. This could be taken further to allow
// screenshots to be compared from any appium based test thus removing the need to run slow
// tests just for screenshots. 
async function verifyScreenShot( name ) {
    await world.gallery.sleep(500); // wait for scroll bar to disappear
    var base64 = await world.driver.takeScreenshot();
    var screenshot = Buffer.from( base64, 'base64' );
    if ( fs.existsSync( screenshotPath( screenshot, name ) ) ) {
        try {
            await assertLooksSame( screenshot, screenshotPath( screenshot, name ) );
        } catch(e) {
            fs.writeFileSync(screenshotPath( screenshot, name, "regression" ), screenshot );
            looksSame.createDiff({
                reference: screenshotPath( screenshot, name ),
                current: screenshotPath( screenshot, name, "regression" ),
                diff: screenshotPath( screenshot, name, "diff" ),
                highlightColor: "#ff0000",
                tolerance: 5
            }, function() {} );
            throw e;
        }
    } else {
        var path = screenshotPath( screenshot, name, "baseline" );
        fs.writeFileSync( path, screenshot );
        console.warn(`Generated base line image: ${path}. Manually verify image and remove the "_baseline" from the string to accept.`);
    }
}

describe('Visual regression tests', function() {
    this.retries(4);
    after( stopAppium );
    describe('identify via speedbug workflow',async function() {
        before( startAppium );
        
        it('menu screen should look correct', async function() {
            return verifyScreenShot( 'menu screen' );
        });

        it('menu screen identify should look correct', async function() {
            await world.menu.selectIdentify();
            return verifyScreenShot( 'menu screen identify' );
        });

        it('speedbug should look correct', async function() {
            await world.methodSelect.viaSpeedbug();
            return verifyScreenShot( 'speedbug' );
        });

        it('taxon screen should look correct', async function() {
            await world.speedbug.chooseSpeedbug("hyriidae");
            await world.taxon.waitForText("Freshwater mussels");
            return verifyScreenShot( 'taxon detail screen' );
        });

        it('gallery screen should look correct', async function() {
            await world.taxon.goMagnify();
            
            return verifyScreenShot( 'gallery screen' );
        });
    });

    describe('about and help pages', async function() {
        before( startAppium );
      
        it('about page should render',async function() {
            await world.menu.selectAbout();
            return verifyScreenShot( this.test.title );
        });

        it('help page should render',async function() {
            await world.about.click("Home")
            await world.menu.waitFor();
            await world.menu.selectHelp();
            await verifyScreenShot( this.test.title );
        });
    });

    describe.skip('survey work flow (empty tray)', async function() {
        before( startAppium );
       
        it('site details should look correct', async function() {
             await world.menu.selectWaterbugSurvey();   // the problem here is that if a survey is partially complete the form will be filled out need a way to clear db for testing
             await verifyScreenShot( "site details" );
        });
        it('habitat should look correct', async function() {
            await world.siteDetails.selectDetailed();
            await world.siteDetails.selectRiver();
            await world.siteDetails.setWaterbodyName("a");
            await world.siteDetails.goNext();
            return verifyScreenShot( "habitat" );
        });

        it('empty sample tray should look correct', async function() {
            await world.habitat.setSandOrSilt("100");
            await world.habitat.goNext();
            return verifyScreenShot( "empty sample tray" );
        });
  
        it('zero bug summary should look correct', async function() {
            await world.sample.goNext();
            return verifyScreenShot( "zero bug summary" );
        });
    })
});