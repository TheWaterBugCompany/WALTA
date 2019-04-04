var GalleryWindow = require('ui/GalleryWindow');
var moment = require('lib/moment');
var { removeFilesBeginningWith } = require('logic/FileUtils');
var args = $.args;
if ( $.args.left ) $.photoSelectInner.left = $.args.left;
if ( $.args.right ) $.photoSelectInner.right = $.args.right;
if ( $.args.top ) $.photoSelectInner.top = $.args.top;
if ( $.args.bottom ) $.photoSelectInner.bottom = $.args.bottom;
setImage( $.args.image );


var readOnlyMode = $.args.readonly ;
var cropPhoto = $.args.cropPhoto;
if ( readOnlyMode ) {
    $.iconHolder.remove( $.camera );
    $.photoSelectLabel.visible = false;
    $.photoSelectOptionalLabel.visible = false;
}

function generateThumbnail( fileOrBlob ) {

    function savePhoto( blob, filename  ) {
        var photoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename );

        Ti.API.info(`File path ${photoPath.nativePath}`);
        if ( photoPath.exists() ) {
            var result = photoPath.deleteFile();
            if ( !result )
                Ti.API.error(`Error deleting file: writable: ${photoPath.writable}`);
        }
    
        var result = photoPath.write(blob);
        if ( !result )
            Ti.API.error(`Error writing file: exists: ${photoPath.exists()}`);

        return photoPath.nativePath;
    }

    Ti.API.info(`Generating thumbnail...`);
    var fullPhoto = null;
    if ( typeof fileOrBlob === "string") {
        fullPhoto = Ti.UI.createImageView( { image: fileOrBlob } ).toBlob();
    } else {
        fullPhoto = fileOrBlob;
    }
    Ti.API.info(`Saving full size photo...`);
    var fullPhotoPath = savePhoto( fullPhoto, `preview_full_${moment().unix()}.jpg`);
    
    Ti.API.info(`image width = ${fullPhoto.width} image height = ${fullPhoto.height}`);
    var pxWidth = Ti.UI.convertUnits( `${$.photoSelectInner.size.width}dp`, Ti.UI.UNIT_PX );
    var pxHeight = Ti.UI.convertUnits( `${$.photoSelectInner.size.height}dp`, Ti.UI.UNIT_PX );

    Ti.API.info(`photo view width = ${$.photoSelectInner.size.width} height = ${$.photoSelectInner.size.height}`);
    var newHeight = pxWidth*(fullPhoto.height/fullPhoto.width);
    
    var thumbnail = fullPhoto.imageAsResized( pxWidth, newHeight );
    fullPhoto = null;
    var cropY = ((newHeight-pxHeight)/2);
    if ( cropY > 0 )
        thumbnail = thumbnail.imageAsCropped( { width: pxWidth, height: pxHeight, x:0, y:cropY });

    // We need to save the photo thumbnail to a file path so that the photo gallery 
    // can read it via a URL
    Ti.API.info("removing old preview files...");
    removeFilesBeginningWith("preview_");
    Ti.API.info(`Saving thumbnail...`);
    var thumbnailPath = savePhoto( thumbnail, `preview_${moment().unix()}.jpg`);
    thumbnail = null;
    return { thumbnail: thumbnailPath, photo: fullPhotoPath };
}

function generateUpload( blob ) {
    Ti.API.info(`compressing photo for upload`);
    if ( ! blob.nativePath )
        return blob.imageAsCompressed( 0.9 );
    else
        return blob.nativePath;
}

function setImage( fileOrBlob ) {
    Ti.API.info(`set thumbail to ${fileOrBlob}`);
    if ( !fileOrBlob && !readOnlyMode) {
        $.photoSelectOptionalLabel.visible = true;
        $.magnify.visible = false;
        return;
    } 

    function setThumbnail( fileOrBlob) {
        if ( cropPhoto || typeof fileOrBlob === "object") {
            var { thumbnail, photo } = generateThumbnail( fileOrBlob );
            $.photo.image = thumbnail;
            $.photoUrls = [photo];
        } else {
            $.photo.image = fileOrBlob;
            $.photoUrls = [fileOrBlob];
        }
    }

    function processPhoto( fileOrBlob ) {
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

function openGallery() {
    if ( $.magnify.visible ) {
        var galleryWin = GalleryWindow.createGalleryWindow($.photoUrls);
        galleryWin.open();
    }
}

function takePhoto() {
    if ( $.disabled) return;
    requestCameraPermissions(
        function success() {
            Ti.Media.showCamera({
                autohide: true,
                animated: false,
                autorotate: true,
                success: function (result) {
                    setImage( result );
                    Ti.API.info(`${JSON.stringify(result)}`);
                    $.trigger("photoTaken", $.photo.image );
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
    $.resetClass( $.photoSelectBoundary, "");
    $.photoSelectLabel.visible = false;
}

exports.openGallery = openGallery;
exports.setImage = setImage;
exports.setError = setError;
exports.clearError = clearError;
exports.disable = disable;
exports.enable = enable;
