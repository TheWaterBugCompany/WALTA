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
    it('gallery images should display correctly',async function() {

        await verifyScreenShot( 'menu screen' );

        await world.menu.selectIdentify();

        await verifyScreenShot( 'menu screen identify' );

        await world.methodSelect.viaSpeedbug();

        await verifyScreenShot( 'speedbug' );

        await world.speedbug.chooseSpeedbug("hyriidae");

        await world.taxon.waitForText("Freshwater mussels");
        await verifyScreenShot( 'taxon detail screen' );

        await world.taxon.goMagnify();
        await world.gallery.sleep(100); // wait for scroll bar to disappear

        await verifyScreenShot( this.test.title );
    });

    it('about page should render',async function() {
        await world.menu.selectAbout();
        await verifyScreenShot( this.test.title );
    });

    it('help page should render',async function() {
        await world.menu.selectHelp();
        await verifyScreenShot( this.test.title );
    });
});