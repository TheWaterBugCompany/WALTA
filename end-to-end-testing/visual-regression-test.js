var fs = require('fs');
var sizeOf = require('image-size');
var looksSame = require('looks-same');
const { navigateGoBack,
    navigateBrowseViaTray,
    navigateSpeedbugNotSureViaTray, 
    navigateSpeedbugViaTray, 
    navigateKeyViaIdentify, 
    navigateBrowseViaIdentify, 
    navigateSpeedbugViaIdentify, 
    navigateSpeedbugNotSureViaIdentify,
    navigateTakePhoto } = require('../features/support/navigation-driver');

function assertLooksSame( img1, img2 ) {
    return new Promise( function(resolve, reject) {
        looksSame( img1, img2, { tolerance: 5, ignoreAntialiasing: true, antialiasingTolerance: 6 }, function(error, result) {
            if ( error ) {
                reject(error);
            } else {
                try { 
                    expect(result.equal, "baseline image is different" ).to.be.true;
                    resolve();
                } catch(e) {
                    reject(e);
                }
            }
        });
    });
}

function screenshotPath( screenshot, name, postfix="" ) {
    var dims = sizeOf(screenshot);
    return `${__dirname}/baseline-images/${name.replace(/ /g,"_")}_${dims.width}x${dims.height}${postfix.length > 0 ?"_"+postfix:""}.png`;
}

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
            });
            throw e;
        }
    } else {
        var path = screenshotPath( screenshot, name, "baseline" );
        fs.writeFileSync( path, screenshot );
        console.warn(`Generated base line image: ${path}. Manually verify image and remove the "_baseline" from the string to accept.`);
    }
}

describe('Visual regression tests', function() {
    describe('identify via speedbug workflow',async function() {
        before( startAppium );
        after( stopAppium );
        it('menu screen should look correct', async function() {
            await verifyScreenShot( 'menu screen' );
        });

        it('menu screen identify should look correct', async function() {
            await world.menu.selectIdentify();
            await verifyScreenShot( 'menu screen identify' );
        });

        it('speedbug should look correct', async function() {
            await world.methodSelect.viaSpeedbug();
            await verifyScreenShot( 'speedbug' );
        });

        it('taxon screen should look correct', async function() {
            await world.speedbug.chooseSpeedbug("hyriidae");
            await world.taxon.waitForText("Freshwater mussels");
            await verifyScreenShot( 'taxon detail screen' );
        });

        it('gallery screen should look correct', async function() {
            await world.taxon.goMagnify();
            
            await verifyScreenShot( 'gallery screen' );
        });
    });

    describe('about and help pages', async function() {
        before( startAppium );
        after( stopAppium );
        it('about page should render',async function() {
            await world.menu.selectAbout();
            await verifyScreenShot( this.test.title );
        });

        it('help page should render',async function() {
            await navigateGoBack(world);
            await world.menu.waitFor();
            await world.menu.selectHelp();
            await verifyScreenShot( this.test.title );
        });
    });

    describe('survey work flow (empty tray)', async function() {
        before( startAppium );
        after( stopAppium );
        it('site details should look correct', async function() {
             await world.menu.selectWaterbugSurvey();
             await verifyScreenShot( "site details" );
        });
        it('habitat should look correct', async function() {
            await world.siteDetails.selectDetailed();
            await world.siteDetails.selectRiver();
            await world.siteDetails.setWaterbodyName("a");
            await world.siteDetails.goNext();
            await verifyScreenShot( "habitat" );
        });

        it('empty sample tray should look correct', async function() {
            await world.habitat.setSandOrSilt("100");
            await world.habitat.goNext();
            await verifyScreenShot( "empty sample tray" );
        });
  
        it('zero bug summary should look correct', async function() {
            await world.sample.goNext();
            await verifyScreenShot( "zero bug summary" );
        });
    })
});