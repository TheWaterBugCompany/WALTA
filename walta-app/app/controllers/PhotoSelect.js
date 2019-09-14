var moment = require('lib/moment');
var { removeFilesBeginningWith } = require('logic/FileUtils');
var Topics = require("ui/Topics");

if ( $.args.left ) $.photoSelectInner.left = $.args.left;
if ( $.args.right ) $.photoSelectInner.right = $.args.right;
if ( $.args.top ) $.photoSelectInner.top = $.args.top;
if ( $.args.bottom ) $.photoSelectInner.bottom = $.args.bottom;
$.photoSelectLabel.visible = false;
$.photoSelectOptionalLabel.visible = false;
setImage( $.args.image );
clearError();


var readOnlyMode = $.args.readonly ;
var cropPhoto = $.args.cropPhoto;
if ( readOnlyMode ) {
    $.iconHolder.remove( $.camera );
}

function debug(mess) { 
    Ti.API.debug(mess);
}

function readFile(path) {
    let file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, path);
    return file.read();
}

function generateThumbnail( fileOrBlob ) {
    debug("generateThumbnail");
    function savePhoto( blob, filename  ) {
        var photoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename );

        debug(`File path ${photoPath.nativePath}`);
        if ( photoPath.exists() ) {
            var result = photoPath.deleteFile();
            if ( !result ) {
                Ti.API.error(`Error deleting file: writable: ${photoPath.writable}`);
                throw new Error(`Unable to delete file ${photoPath}`);
            }
                
        }
    
        var result = photoPath.write(blob);
        if ( !result ) {
            Ti.API.error(`Error writing file: exists: ${photoPath.exists()}`);
            throw new Error(`Unable to write file ${photoPath}`);
        }

        return photoPath.nativePath;
    }
    // We need to save the photo thumbnail to a file path so that the photo gallery 
    // can read it via a URL
    debug("removing old preview files...");
    removeFilesBeginningWith("preview_");

    debug("generating thumbnail...");
    var fullPhoto = null;
    if ( typeof fileOrBlob === "string") {
        fullPhoto = readFile( fileOrBlob );
    } else {
        fullPhoto = fileOrBlob;
    }
    var aspectRatio = (fullPhoto.height/fullPhoto.width);

    if ( fullPhoto.length > 4*1024*1024 ) {
        Ti.API.info(`file too big, size is ${fullPhoto.length/(1024*1024)}Mb resizing and compressing photo...`);
        fullPhoto = fullPhoto.imageAsResized(1024, 1024*aspectRatio);
    }

    if ( ( fullPhoto.mimeType === "image/png" ) ) {
        Ti.API.info(`got a PNG: converting photo in JPEG...`);
        fullPhoto = fullPhoto.imageAsCompressed(0.9);
    }
    
    debug("saving full size photo..");
    var fullPhotoPath = savePhoto( fullPhoto, `preview_full_${moment().unix()}.jpg`);
    
    debug(`image width = ${fullPhoto.width} image height = ${fullPhoto.height}`);
    var pxWidth = Ti.UI.convertUnits( `${$.photoSelectInner.size.width}dp`, Ti.UI.UNIT_PX );
    var pxHeight = Ti.UI.convertUnits( `${$.photoSelectInner.size.height}dp`, Ti.UI.UNIT_PX );

    debug(`photo view width = ${$.photoSelectInner.size.width} height = ${$.photoSelectInner.size.height}`);
    var newHeight = pxWidth*aspectRatio;
    
    var thumbnail = fullPhoto.imageAsResized( pxWidth, newHeight );
    fullPhoto = null;
    var cropY = ((newHeight-pxHeight)/2);
    if ( cropY > 0 )
        thumbnail = thumbnail.imageAsCropped( { width: pxWidth, height: pxHeight, x:0, y:cropY });

    
    debug(`saving thumbnail...`);
    var thumbnailPath = savePhoto( thumbnail, `preview_${moment().unix()}.jpg`);
    thumbnail = null;
    return { thumbnail: thumbnailPath, photo: fullPhotoPath };
}

function setImage( fileOrBlob ) {
    debug(`setImage ${fileOrBlob}`)
    if ( !fileOrBlob && !readOnlyMode) {
        $.photoSelectOptionalLabel.visible = true;
        $.magnify.visible = false;
        return;
    } 
    

    function setThumbnail( fileOrBlob) {
        debug("setThumbnail")
        if ( cropPhoto || typeof fileOrBlob === "object") {
            var { thumbnail, photo } = generateThumbnail( fileOrBlob );
            $.photo.image = thumbnail;
            $.photoUrls = [photo];
        } else {
            debug("not calling generateThumbnail")
            $.photo.image = fileOrBlob;
            $.photoUrls = [fileOrBlob];
        }
    }

    function processPhoto( fileOrBlob ) {
        debug("processPhoto")
        // If an array, then it must contain URL paths to many photos, the first is displayed 
        // in the thumbnail view
        if ( Array.isArray(fileOrBlob) ) {
            setThumbnail( fileOrBlob[0] );
            $.photoUrls = fileOrBlob; // overwrite photoUrls with the complete array of URLs
        } 
        // When an object is passed it must be a TiBlob containing image data
        else if ( typeof(fileOrBlob) === "object" ) {
            setThumbnail( fileOrBlob.media );
        } 
        // Otherwise it can be a URL path to a single photo
        else {
            setThumbnail( fileOrBlob );
        }
        $.photoSelectOptionalLabel.visible = false;
        $.magnify.visible = true;
        $.trigger("loaded");
    }

    // When the view first opens then we need to postpone the thumbnail creation
    // until after the postlayout event which ensures the width/height are valid
    // and we can use them to crop the image.
    if ( $.photoSelectInner.size.width === 0 && $.photoSelectInner.size.height === 0) {
        $.photoSelectInner.addEventListener("postlayout", function postpone() {
            $.photoSelectInner.removeEventListener("postlayout", postpone);
            processPhoto( fileOrBlob );
        });
    } else {
        processPhoto( fileOrBlob );
    }
   
}

function requestCameraPermissions( success, failure ) {
    if (!Ti.Media.hasCameraPermissions()) {
        Ti.Media.requestCameraPermissions(function (e) {
            if (e.success) {
                success();
            } else {
                failure();
            }
        });
    } else {
        success();
    }
}

function openGallery(e) {
    e.cancelBubble = true;
    if ( $.magnify.visible ) {
        debug(`opening gallery photoUrls: ${JSON.stringify($.photoUrls)}`);
        Topics.fireTopicEvent( Topics.GALLERY, { photos: $.photoUrls, showPager: true }  );
    }
}

function takePhoto(e) {
    if ( $.disabled) return;
    e.cancelBubble = true;
    requestCameraPermissions(
        function success() {
            Ti.Media.showCamera({
                autohide: true,
                animated: false,
                autorotate: true,
                success: function (result) {
                    setImage( result );
                    $.trigger("photoTaken", $.photo.image.nativePath );
                },
                error: function (error) {
                    alert(`${error.error}`); 
                },
                saveToPhotoGallery: false,
                whichCamera: Titanium.Media.CAMERA_FRONT,
                mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
            });
        },

        function failure() {
            alert("Unable to get permissions for the camera, please allow camera permissions to take photos");
        }

    )
} 

function disable() {
    $.disabled = true;
}

function enable() {
    $.disabled = false;
}

function setError() {
    $.resetClass( $.photoSelectBoundary, "photoError" );
    $.photoSelectLabel.visible = true;
}

function clearError() {
    $.resetClass( $.photoSelectBoundary, "photoNoError");
    $.photoSelectLabel.visible = false;
}

function getImageUrl() {
    return $.photo.image;
}

exports.getImageUrl = getImageUrl;
exports.openGallery = openGallery;
exports.setImage = setImage;
exports.setError = setError;
exports.clearError = clearError;
exports.disable = disable;
exports.enable = enable;

function cleanUp() {
    $.destroy();
    $.off();
}
exports.cleanUp = cleanUp;
  