const looksSame = require('looks-same');
const path = require('path');
const fs = require('fs');
const images = require('images');
const { expect } = require("chai");

function ensurePng(filePath) {
    if ( typeof filePath !== "string" )
        return filePath;
    console.log(`reading image from ${filePath}`);
    let img = fs.readFileSync(filePath);
    if ( img === undefined ) 
            throw `Unable to read file ${filePath}`;
    if ( path.extname(filePath) !== "png" ) {
        return images(img).encode("png");
    } else {
        return img;
    }
}

function assertLooksSame( img1, img2 ) {
    return new Promise( function(resolve, reject) {
        
        

        looksSame( ensurePng(img1), ensurePng(img2), { tolerance: 50, ignoreAntialiasing: true, antialiasingTolerance: 6 }, function(error, result) {
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

function diffImages(img1,img2,diffPath,done) {
    console.log(`difference image ${diffPath}`);
    let ref = ensurePng(img1), cur = ensurePng(img2);
    looksSame.createDiff({
        reference: ref,
        current: cur,
        highlightColor: "#ff0000",
        tolerance: 40
    }, function(error, buffer) {
        if ( error )
            throw new Error(error);
        fs.writeFileSync(diffPath,buffer);
        fs.writeFileSync("/tmp/img1.png",ref);
        fs.writeFileSync("/tmp/img2.png",cur);
        done();
    } );
}
exports.diffImages = diffImages;
exports.assertLooksSame = assertLooksSame;