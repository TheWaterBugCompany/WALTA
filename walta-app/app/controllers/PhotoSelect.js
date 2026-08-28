var Logger = require('util/Logger');
var info = (m, tag = "media") => Logger.log(m, tag);
var debug = (m, tag = "media") => Logger.debug(m, tag);
var error = (m, tag = "media") => Logger.error(m, tag);
var moment = require('lib/moment');
var { removeFilesBeginningWith } = require('logic/FileUtils');
var { optimisePhoto, savePhoto, loadPhoto, absolutePath } = require('util/PhotoUtils');
var Topics = require("ui/Topics");

var readOnlyMode = false;
var originalPhotoUrl = null;
setReadOnlyMode( $.args.readonly === true );


if ( $.args.left ) $.photoSelectInner.left = $.args.left;
if ( $.args.right ) $.photoSelectInner.right = $.args.right;
if ( $.args.top ) $.photoSelectInner.top = $.args.top;
if ( $.args.bottom ) $.photoSelectInner.bottom = $.args.bottom;
$.photoSelectLabel.visible = false;
$.photoSelectOptionalLabel.visible = false;
setImage( $.args.image );
clearError();


var cropPhoto = $.args.cropPhoto;
var aspectFit = $.args.aspectFit === true;

function setReadOnlyMode(p_readOnlyMode) {
    readOnlyMode = p_readOnlyMode;
    info(`readOnlyMode = ${readOnlyMode}`);
    setEditControlsVisible( !readOnlyMode );
}

// The camera and gallery-import buttons are the editing affordances: shown
// together when the photo is editable, hidden together in readonly mode.
function setEditControlsVisible( visible ) {
    $.camera.visible = visible;
    $.gallery.visible = visible;
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
    debug(`generating thumbnail... fileOrBlob = ${fileOrBlob}`);
    var fullPhoto = null;
    
    if ( typeof fileOrBlob === "string") {
        fullPhoto = loadPhoto( fileOrBlob );
    } else {
        fullPhoto = fileOrBlob;
    }

    if ( ! fullPhoto ) {
        error(`Error loading photo: ${fileOrBlob}`);
        throw new Error("Unable to load photo");
    }

    // We need to save the photo thumbnail to a file path so that the photo gallery 
    // can read it via a URL
    debug("removing old preview files...");
    removeFilesBeginningWith("preview_");

    // we downscale for high resolution, otherwise the crop will fail due to out of memory errors.
    fullPhoto = optimisePhoto(fullPhoto);
    
    debug("saving full size photo..");

    var fullPhotoPath = savePhoto( fullPhoto, `preview_full_${moment().valueOf()}.jpg`);
    fullPhoto = null; // release memory - fingers crossed

    fullPhoto = loadPhoto( fullPhotoPath );
    
    debug(`image width = ${fullPhoto.width} image height = ${fullPhoto.height}`);
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
        debug(`cropping image to view aspect new width = ${newWidth} new height = ${newHeight}`);
        var cropY = (fullPhoto.height-newHeight)/2;
        var thumbnail = fullPhoto.imageAsCropped( { width: newWidth, height: newHeight, x:cropX, y:cropY });
        if ( ! thumbnail ) {
            error(`Error cropping to create thumbnail: ${fullPhotoPath}`);
            throw new Error("Unable to crop photo");
        }
    }
    debug(`ratio after crop ${thumbnail.width/thumbnail.height} - view ratio ${viewRatio}`)

    debug(`saving thumbnail...`);
    var thumbnailPath = savePhoto( thumbnail, `preview_thumbnail_${moment().valueOf()}.jpg`);
    return { thumbnail: thumbnailPath, photo: fullPhotoPath };
}

// Reference images (e.g. dichotomous-key questions) must show the whole photo —
// cropping could hide the diagnostic features being matched — so we letterbox
// rather than fill. Scaling the ImageView to dimensions that keep the source
// ratio avoids the stretch without re-encoding the image (WB-175).
function fitToView( path ) {
    var photo = loadPhoto( path );
    var pxWidth = $.photoSelectInner.size.width;
    var pxHeight = $.photoSelectInner.size.height;
    var scale = Math.min( pxWidth / photo.width, pxHeight / photo.height );
    $.photo.width = Math.round( photo.width * scale );
    $.photo.height = Math.round( photo.height * scale );
    $.photo.image = photo;
    $.photoUrls = [absolutePath(path).nativePath];
}

function getOriginalPhotoUrl() {
    return originalPhotoUrl;
}

function setImage( fileOrBlob ) {
    info(`setImage ${fileOrBlob}`)
    if ( typeof fileOrBlob === "string")
        originalPhotoUrl = fileOrBlob;
    if ( !fileOrBlob && !readOnlyMode) {
        $.photoSelectOptionalLabel.visible = true;
        $.magnify.visible = false;
        setEditControlsVisible( !readOnlyMode );
        return;
    }

    $.photoSelectOptionalLabel.visible = false;
    $.magnify.visible = true;
    setEditControlsVisible( !readOnlyMode );
    

    function setThumbnail( fileOrBlob) {
        info(`setThumbnail ${fileOrBlob}`)
        if ( aspectFit && typeof fileOrBlob === "string" ) {
            fitToView( fileOrBlob );
        } else if ( cropPhoto || typeof fileOrBlob === "object") {
            var { thumbnail, photo } = generateThumbnail( fileOrBlob );
            $.photo.image = thumbnail;
            $.photoUrls = [photo];
        } else {
            // Crop to the panel aspect ratio so a non-square panel can't
            // stretch the photo (WB-175); the gallery still gets the original.
            var { thumbnail } = generateThumbnail( fileOrBlob );
            $.photo.image = thumbnail;
            // Resolve relative/legacy stored paths so the gallery can load them (WB-88).
            $.photoUrls = [absolutePath(fileOrBlob).nativePath];
        }
        
    }

    async function processPhoto( fileOrBlob ) {
        debug("processPhoto");
        $.photoSelectOptionalLabel.visible = false;
        
        $.photo.visible = false;
        
        await new Promise( (resolve) => {
            $.iconHolder.addEventListener("postlayout",
                function e() {
                    $.iconHolder.removeEventListener("postlayout",e);
                    resolve();
                })
            $.iconHolder.fireEvent("postlayout");
        });
        
        $.activity.show();
        $.trigger("loading");
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
        else if ( ! _.isUndefined(fileOrBlob) ) {
            var file = fileOrBlob;
            setThumbnail( file );
        }
        
        setTimeout( () => { 
            $.activity.hide();
            $.photo.visible = true;
            info("triggering loaded event")
            $.trigger("loaded");
        },1); 
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

var Camera = require('ui/Camera');
var Gallery = require('ui/Gallery');

function requestCameraPermissions( success, failure ) {
    if (!Camera.hasCameraPermissions()) {
        Camera.requestCameraPermissions(function (e) {
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

function requestGalleryPermissions( success, failure ) {
    if (!Gallery.hasPhotoGalleryPermissions()) {
        Gallery.requestPhotoGalleryPermissions(function (e) {
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

// The app is landscape-locked but the system camera/gallery pickers force a
// portrait rotation. Open them behind a black "blind" window so that rotation
// — and any layout artifacts on the way back — aren't visible to the user.
// openPicker receives { captured, dismiss }:
//   captured(result) — picker returned a photo: close the blind first, then
//       hand the result on once the blind has fully gone, so the heavy
//       thumbnail processing happens hidden behind it.
//   dismiss()        — picker was cancelled or errored: just close the blind.
function openBehindBlind( openPicker ) {
    let blinds = Ti.UI.createWindow( { backgroundColor: "black", exitOnClose: false } );
    // The OS picker can take several seconds to present; spin on the blind so
    // the user sees activity rather than a dead black screen. The picker covers
    // it once presented, and it's torn down with the blind.
    let spinner = Ti.UI.createActivityIndicator({
        style: Ti.UI.ActivityIndicatorStyle.BIG,
        indicatorColor: "white"
    });
    blinds.add( spinner );
    function captured( result ) {
        blinds.addEventListener( "close", function handler() {
            blinds.removeEventListener("close", handler);
            setTimeout( () => photoCapturedHandler(result), 50 );
        });
        blinds.close();
    }
    function dismiss() {
        blinds.close();
    }
    blinds.addEventListener("open", function handler() {
        blinds.removeEventListener("open", handler );
        spinner.show();
        openPicker({ captured, dismiss });
    });
    blinds.open();
}

function openPhotoGallery() {
    function showPicker({ captured, dismiss }) {
        Gallery.openPhotoGallery({
            autohide: true,
            animated: true,
            allowMultiple: false, // one photo per slot, matching the camera flow
            success: captured,
            cancel: dismiss,
            error: (err) => {
                dismiss();
                alert(`Unable to open gallery: ${err.error}`);
            },
            mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
        });
    }
    // Only iOS forces the portrait-rotation flip that the blind hides. On
    // Android, wrapping the picker's real intent in a heavyweight blind window
    // breaks its result delivery (the photo never comes back), so open it
    // directly.
    if (OS_IOS) {
        openBehindBlind( showPicker );
    } else {
        showPicker({ captured: photoCapturedHandler, dismiss: () => {} });
    }
}

function chooseFromGallery(e) {
    if ( $.disabled ) return;
    e.cancelBubble = true;
    if ( OS_ANDROID ) {
        // Android's system photo picker grants access per selection, so there
        // is no runtime permission to request — and Ti.Media.hasPhotoGallery-
        // Permissions is unreliable on API 33+ (returns false even when
        // READ_MEDIA_IMAGES is granted), so gating on it would wrongly block.
        openPhotoGallery();
    } else {
        requestGalleryPermissions(
            openPhotoGallery,
            function failure() {
                alert("Unable to access the photo gallery, please allow photo permissions to add photos");
            }
        );
    }
}

function openGallery(e) {
    e.cancelBubble = true;
    if ( $.magnify.visible ) {
        info(`opening photo viewer photoUrls: ${JSON.stringify($.photoUrls)}`);
        Topics.fireTopicEvent( Topics.PHOTO_VIEWER, { photos: $.photoUrls } );
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
            openBehindBlind( ({ captured, dismiss }) => {
                Camera.showCamera({
                    autohide: true,
                    animated: false,
                    autorotate: false,
                    cancel: dismiss,
                    success: (result) => {
                        info("Got camera success");
                        captured(result);
                    },
                    error: function (error) {
                        dismiss();
                        alert(`Unable to open camera: ${error.error}`);
                    },
                    saveToPhotoGallery: true,
                    whichCamera: Titanium.Media.CAMERA_FRONT,
                    mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
                });
            });
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
exports.getOriginalPhotoUrl = getOriginalPhotoUrl
exports.openGallery = openGallery; 
exports.setImage = setImage;
exports.setError = setError;
exports.clearError = clearError;
exports.photoCapturedHandler = photoCapturedHandler; // for tests

function layoutChildrenHorizontallyFromTheRight(data) {
    //Ti.API.info("layout children")
    let right = 0;
    data.source.children.slice().reverse().forEach( c => {
        if ( c.visible ) {
            c.right = right;
            right += c.size.width;
        }
    });
}


$.iconHolder.addEventListener("postlayout", layoutChildrenHorizontallyFromTheRight);

function cleanUp() {
    debug("cleaning up PhotoSelect");
    $.iconHolder.removeEventListener("postlayout", layoutChildrenHorizontallyFromTheRight);
    $.destroy();
    $.off();
}
exports.cleanUp = cleanUp;
  