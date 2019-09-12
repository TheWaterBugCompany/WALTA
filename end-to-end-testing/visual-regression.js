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
        looksSame( img1, img2, function(error, {equal}) {
            try { 
                expect(equal, "baseline image is different" ).to.be.true;
                resolve();
            } catch(e) {
                reject(e);
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
            throw e;
        }
    } else {
        var path = screenshotPath( screenshot, name, "baseline" );
        fs.writeFileSync( path, screenshot );
        throw new Error(`Generated base line image: ${path}. Manually verify image and remove the "_baseline" from the string to accept.`);
    }
}

describe('Visual regression tests', function() {
    it.only('gallery images should display correctly',async function() {
        await navigateSpeedbugViaIdentify( world, "hyriidae" );
        await world.taxon.waitForText("Freshwater mussels");
        await world.taxon.goMagnify();
        await verifyScreenShot( this.test.title );
    });
});