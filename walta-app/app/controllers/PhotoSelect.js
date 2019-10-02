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
    $.camera.visible = false;
}

function debug(mess) { 
    Ti.API.debug(mess);
}

function absolutePath(path) {
    if ( path.startsWith("file:///") ) {
        debug(`${path} starts with file:///`);
        return Ti.Filesystem.getFile(path);
    } else if ( path.startsWith("/") ) {
        debug(`${path} starts with /`)
        return Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,path);
    } else {
        debug(`${path} doesn't start with /`)
        return Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, path);
    }
}

function readFile(path) {
    debug(`reading ${path}`)
    return absolutePath(path).read();
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
    debug("generateThumbnail");
    function savePhoto( blob, filename  ) {
        var photoPath = absolutePath(filename);
        debug(`File path ${photoPath.nativePath}`);
        if ( photoPath.exists() ) {
            debug("file already exists deletin");
            var result = photoPath.deleteFile();
            if ( !result ) {
                Ti.API.error(`Error deleting file: writable: ${photoPath.writable}`);
                throw new Error(`Unable to delete file ${photoPath}`);
            }         
        }
    
        var result = photoPath.write(blob);
        blob = null; 
        if ( !result ) {
            Ti.API.error(`Error writing file: exists: ${photoPath.exists()}`);
            throw new Error(`Unable to write file ${photoPath}`);
        }

        return photoPath.nativePath;
    }

    debug("generating thumbnail...");
    var fullPhoto = null;
    if ( typeof fileOrBlob === "string") {
        fullPhoto = readFile( fileOrBlob );
    } else {
        fullPhoto = fileOrBlob;
    }

    if ( ! fullPhoto ) { 
        Ti.API.error(`Error loading photo: ${fileOrBlob}`);
        throw new Error("Unable to load photo");
    }

    // We need to save the photo thumbnail to a file path so that the photo gallery 
    // can read it via a URL
    debug("removing old preview files...");
    removeFilesBeginningWith("preview_");

    var aspectRatio = (fullPhoto.height/fullPhoto.width);

    debug( `photo size in bytes ${fullPhoto.length}, width = ${fullPhoto.width}, height = ${fullPhoto.height}` )
    // we downscale for high resolution, otherwise the crop will fail due to out of memory errors.
    if ( fullPhoto.length > 4*1024*1024 || fullPhoto.width > 1600 || fullPhoto.height > 1600 ) {
        Ti.API.info(`file too big, size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}, resizing and compressing photo...`);
        //if ( aspectRatio < )
        fullPhoto = fullPhoto.imageAsResized(1600, 1600*aspectRatio);
        debug( `photo size in bytes ${fullPhoto.length}, width = ${fullPhoto.width}, height = ${fullPhoto.height}` )
        if ( ! fullPhoto ) {
            Ti.API.error(`Error resizing photo: ${fileOrBlob}`);
            throw new Error("Unable to resize photo");
        }
        Ti.API.info(`compressed size is ${fullPhoto.length/(1024*1024)}Mb, width = ${fullPhoto.width}, height = ${fullPhoto.height}`);
    }

    if ( ( fullPhoto.mimeType === "image/png" ) && ( Ti.Platform.osname !== "android") ) {
        Ti.API.info(`got a PNG: converting photo into JPEG...`);
        fullPhoto = fullPhoto.imageAsCompressed(0.9);
        if ( ! fullPhoto ) {
            Ti.API.error(`Error converting photo: ${fileOrBlob}`);
            throw new Error("Unable to convert photo into JPEG");
        }
    }
    
    debug("saving full size photo..");

    var fullPhotoPath = savePhoto( fullPhoto, `preview_full_${moment().valueOf()}.jpg`);
    fullPhoto = null; // release memory - fingers crossed
    fullPhoto = readFile( fullPhotoPath );
    
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
            Ti.API.error(`Error cropping to create thumbnail: ${fullPhotoPath}`);
            throw new Error("Unable to crop photo");
        }
    }
    debug(`ratio after crop ${thumbnail.width/thumbnail.height} - view ratio ${viewRatio}`)

    debug(`saving thumbnail...`);
    var thumbnailPath = savePhoto( thumbnail, `preview_thumbnail_${moment().valueOf()}.jpg`);
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
            var blob = fileOrBlob.media;
            fileOrBlob.media = null;
            setThumbnail( blob );
        } 
        // Otherwise it can be a URL path to a single photo
        else {
            var file = fileOrBlob;
            setThumbnail( file );
        }
        $.photoSelectOptionalLabel.visible = false;
        $.magnify.visible = true;
        debug("triggering loaded event")
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




exports.getThumbnailImageUrl = getThumbnailImageUrl;
exports.getFullPhotoUrl = getFullPhotoUrl;
exports.openGallery = openGallery; 
exports.setImage = setImage;
exports.setError = setError;
exports.clearError = clearError;
exports.disable = disable;
exports.enable = enable;
exports.photoCapturedHandler = photoCapturedHandler; // for tests

function cleanUp() {
    debug("cleaning up PhotoSelect");
    $.destroy();
    $.off();
}
exports.cleanUp = cleanUp;
  