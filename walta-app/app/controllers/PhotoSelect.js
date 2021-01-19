var Crashlytics = require('util/Crashlytics');
var info = Crashlytics.log;
var moment = require('lib/moment');
var { removeFilesBeginningWith } = require('logic/FileUtils');
var { optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');
var Topics = require("ui/Topics");

if ( $.args.left ) $.photoSelectInner.left = $.args.left;
if ( $.args.right ) $.photoSelectInner.right = $.args.right;
if ( $.args.top ) $.photoSelectInner.top = $.args.top;
if ( $.args.bottom ) $.photoSelectInner.bottom = $.args.bottom;
$.photoSelectLabel.visible = false;
$.photoSelectOptionalLabel.visible = false;
setImage( $.args.image );
clearError();

var readOnlyMode = false;
setReadOnlyMode($.args.readonly === true);
var cropPhoto = $.args.cropPhoto;

function setReadOnlyMode(p_readOnlyMode) {
    readOnlyMode = p_readOnlyMode;
    Ti.API.info(`readOnlyMode = ${readOnlyMode}`);
    if ( readOnlyMode ) {
        $.iconHolder.remove( $.camera );
        $.camera.visible = false;
    } else {
        $.iconHolder.add( $.camera );
        $.camera.visible = true;
    }
}

function getFullPhotoUrl() {
    if ( $.photoUrls )
        return $.photoUrls[0];
    else
        return undefined;
}

function getThumbnailImageUrl() {
    return $.photo.image;
}


function generateThumbnail( fileOrBlob ) {
    info(`generating thumbnail... fileOrBlob = ${fileOrBlob}`);
    var fullPhoto = null;
    if ( typeof fileOrBlob === "string") {
        fullPhoto = loadPhoto( fileOrBlob );
    } else {
        fullPhoto = fileOrBlob;
    }

    if ( ! fullPhoto ) { 
        Ti.API.error(`Error loading photo: ${fileOrBlob}`);
        throw new Error("Unable to load photo");
    }

    // We need to save the photo thumbnail to a file path so that the photo gallery 
    // can read it via a URL
    info("removing old preview files...");
    removeFilesBeginningWith("preview_");

    // we downscale for high resolution, otherwise the crop will fail due to out of memory errors.
    fullPhoto = optimisePhoto(fullPhoto);
    
    info("saving full size photo..");

    var fullPhotoPath = savePhoto( fullPhoto, `preview_full_${moment().valueOf()}.jpg`);
    fullPhoto = null; // release memory - fingers crossed

    fullPhoto = loadPhoto( fullPhotoPath );
    
    info(`image width = ${fullPhoto.width} image height = ${fullPhoto.height}`);
    var pxWidth = $.photoSelectInner.size.width;
    var pxHeight = $.photoSelectInner.size.height;

    // if the photo was scaled to the size of the view port
    // calculate the height in view coords that would be needed
    // to preserve aspect ratio.
    

    var viewRatio = pxWidth/pxHeight;
    var newHeight = fullPhoto.height, newWidth = fullPhoto.width, cropX = 0, cropY = 0;
    var thumbnail = fullPhoto;

    var viewScaleRatioWidth = pxWidth/fullPhoto.width;
    var photoHeightScaled = viewScaleRatioWidth * fullPhoto.height;
    var heightRatio = pxHeight/photoHeightScaled;
    

    if ( heightRatio < 1 ) {
        newHeight = fullPhoto.height*heightRatio; 
        newWidth = fullPhoto.width;
        cropY = (fullPhoto.height-newHeight)/2;
    } else {
        var viewScaleRatioHeight = pxHeight/fullPhoto.height;
        var photoWidthScaled = viewScaleRatioHeight * fullPhoto.width;
        var widthRatio = pxWidth/photoWidthScaled;
        newWidth= fullPhoto.width*widthRatio;
        newHeight = fullPhoto.height;
        cropX = (fullPhoto.width-newWidth)/2;
    }

    if ( newHeight != fullPhoto.height || newWidth != fullPhoto.width ) {
        info(`cropping image to view aspect new width = ${newWidth} new height = ${newHeight}`);
        var cropY = (fullPhoto.height-newHeight)/2;
        var thumbnail = fullPhoto.imageAsCropped( { width: newWidth, height: newHeight, x:cropX, y:cropY });
        if ( ! thumbnail ) {
            Ti.API.error(`Error cropping to create thumbnail: ${fullPhotoPath}`);
            throw new Error("Unable to crop photo");
        }
    }
    info(`ratio after crop ${thumbnail.width/thumbnail.height} - view ratio ${viewRatio}`)

    info(`saving thumbnail...`);
    var thumbnailPath = savePhoto( thumbnail, `preview_thumbnail_${moment().valueOf()}.jpg`);
    return { thumbnail: thumbnailPath, photo: fullPhotoPath };
}

function setImage( fileOrBlob ) {
    info(`setImage ${fileOrBlob}`)
    if ( !fileOrBlob && !readOnlyMode) {
        $.photoSelectOptionalLabel.visible = true;
        $.magnify.visible = false;
        $.camera.visible = !readOnlyMode;
        return;
    } 

    $.photoSelectOptionalLabel.visible = false;
    $.magnify.visible = true;
    $.camera.visible = !readOnlyMode;
    

    function setThumbnail( fileOrBlob) {
        info("setThumbnail")
        if ( cropPhoto || typeof fileOrBlob === "object") {
            var { thumbnail, photo } = generateThumbnail( fileOrBlob );
            $.photo.image = thumbnail;
            $.photoUrls = [photo];
        } else {
            info("not calling generateThumbnail")
            $.photo.image = fileOrBlob;
            $.photoUrls = [fileOrBlob];
        }
    }

    function processPhoto( fileOrBlob ) {
        info("processPhoto");
        $.photoSelectOptionalLabel.visible = false;
        $.activity.show();
        $.photo.visible = false;
        $.trigger("loading");

        // allow some time to update the display
        setTimeout( function() {
                // If an array, then it must contain URL paths to many photos, the first is displayed 
                // in the thumbnail view
                if ( Array.isArray(fileOrBlob) ) {
                    setThumbnail( fileOrBlob[0] );
                    $.photoUrls = fileOrBlob; // overwrite photoUrls with the complete array of URLs
                } 
                // When an object is passed it must be a TiBlob containing image data
                else if ( typeof(fileOrBlob) === "object" ) {
                    var blob = fileOrBlob.media;
                    fileOrBlob.media = null;
                    setThumbnail( blob );
                } 
                // Otherwise it can be a URL path to a single photo
                else {
                    var file = fileOrBlob;
                    setThumbnail( file );
                }
                
                info("triggering loaded event")
                $.activity.hide();
                $.photo.visible = true;
                $.trigger("loaded");
        }, 1);

        
        
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
        info(`opening gallery photoUrls: ${JSON.stringify($.photoUrls)}`);
        Topics.fireTopicEvent( Topics.GALLERY, { photos: $.photoUrls, showPager: true }  );
    }
}

function photoCapturedHandler( result ) {
    function triggerPhotoTaken() {
        $.off("loaded", triggerPhotoTaken);
        $.trigger("photoTaken", getFullPhotoUrl() );
    }
    $.on("loaded", triggerPhotoTaken );
    setImage( result );
    
}

function takePhoto(e) {
    if ( $.disabled) return;
    e.cancelBubble = true;
    requestCameraPermissions(
        function success() {
            // Create "blinds" to block the display with a black window so that artifacts in any 
            // orientation changes whilst the camera app is opened are not visible to user.
            let blinds = Ti.UI.createWindow( { backgroundColor: "black", exitOnClose: false } );
           
            function openCamera() {
                Ti.Media.showCamera({
                    autohide: true,
                    animated: false,
                    autorotate: false,
                    cancel: () => blinds.close(),
                    success: (result) => {
                        info("Got camera success");
                        // ensure the blind window is closed before starting
                        // the heavy operation of processing the photo
                        blinds.addEventListener( "close", function handler() {
                            blinds.removeEventListener("close", handler);
                            setTimeout( () => photoCapturedHandler(result), 50 );
                        });
                        blinds.close(); 
                    },
                    error: function (error) {
                        blinds.close();
                        alert(`Unable to open camera: ${error.error}`); 
                    },
                    saveToPhotoGallery: true,
                    whichCamera: Titanium.Media.CAMERA_FRONT,
                    mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
                });
            }
            blinds.addEventListener("open", function handler() {
                blinds.removeEventListener("open", handler );
                openCamera();
                
            });
            blinds.open();
                
        },

        function failure() {
            alert("Unable to get permissions for the camera, please allow camera permissions to take photos");
        }

    )
} 

function setError() {
    $.resetClass( $.photoSelectBoundary, "photoError" );
    $.photoSelectLabel.visible = true;
    $.magnify.visible = false;
}

function clearError() {
    $.resetClass( $.photoSelectBoundary, "photoNoError");
    $.photoSelectLabel.visible = false;
    if ( $.photo.image ) {
        $.magnify.visible = true;
    }
}

exports.setReadOnlyMode = setReadOnlyMode;
exports.getThumbnailImageUrl = getThumbnailImageUrl;
exports.getFullPhotoUrl = getFullPhotoUrl;
exports.openGallery = openGallery; 
exports.setImage = setImage;
exports.setError = setError;
exports.clearError = clearError;
exports.photoCapturedHandler = photoCapturedHandler; // for tests

function cleanUp() {
    info("cleaning up PhotoSelect");
    $.destroy();
    $.off();
}
exports.cleanUp = cleanUp;
  