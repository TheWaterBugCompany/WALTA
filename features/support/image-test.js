const looksSame = require('looks-same');

// TODO: 
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

exports.assertLooksSame = assertLooksSame;