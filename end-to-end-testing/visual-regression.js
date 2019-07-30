var fs = require('fs');
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

async function verifyScreenShot( name ) {
    var path = `${__dirname}/baseline-images/${name.replace(/ /g,"_")}.png`;
    var base64 = await world.driver.takeScreenshot();
    var screenshot = Buffer.from( base64, 'base64' );
    if ( fs.existsSync( path ) ) {
        await assertLooksSame( screenshot, path );
    } else {
        fs.writeFileSync(path , screenshot );
    }
}

describe('Visual regression tests', function() {
    it.only('gallery images should display correctly',async function() {
        await navigateBrowseViaIdentify( world, "Adult Baetidae");
        expect( await world.taxon.getHeading() ).to.equal("Baetids");
        await world.taxon.goMagnify();
        await verifyScreenShot( this.test.title );
    });
});