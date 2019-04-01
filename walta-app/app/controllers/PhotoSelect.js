var GalleryWindow = require('ui/GalleryWindow');

var args = $.args;
if ( $.args.left ) $.photoSelectInner.left = $.args.left;
if ( $.args.right ) $.photoSelectInner.right = $.args.right;
if ( $.args.top ) $.photoSelectInner.top = $.args.top;
if ( $.args.bottom ) $.photoSelectInner.bottom = $.args.bottom;
setImage( $.args.image );


var readOnlyMode = $.args.readonly ;
if ( readOnlyMode ) {
    $.iconHolder.remove( $.camera );
}

function generateThumbnail( thumbnailImage ) {
    Ti.API.info(`Generating thumbnail...`);
    var newThumbnail = Ti.UI.createImageView( { image: thumbnailImage } ).toBlob();
    
    Ti.API.info(`image width = ${newThumbnail.width} image height = ${newThumbnail.height}`);
    var pxWidth = Ti.UI.convertUnits( `${$.photoSelectInner.size.width}dp`, Ti.UI.UNIT_PX );
    var pxHeight = Ti.UI.convertUnits( `${$.photoSelectInner.size.height}dp`, Ti.UI.UNIT_PX );

    Ti.API.info(`photo view width = ${$.photoSelectInner.size.width} height = ${$.photoSelectInner.size.height}`);
    var newHeight = pxWidth*(newThumbnail.height/newThumbnail.width);
    
    newThumbnail = thumbnailImage.imageAsResized( pxWidth, newHeight );
    var cropY = ((newHeight-pxHeight)/2);
    if ( cropY > 0 )
        newThumbnail = newThumbnail.imageAsCropped( { width: pxWidth, height: pxHeight, x:0, y:cropY });

    // We need to save the photo thumbnail to a file path so that the photo gallery 
    // can read it via a URL
    Ti.API.info(`Saving thumbnail... ${JSON.stringify(newThumbnail)}`);
    var photoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, `tmp_preview_photo.jpg`);
    Ti.API.info(`File path ${photoPath.nativePath}`);
    if ( photoPath.exists() ) {
        var result = photoPath.deleteFile();
        if ( !result )
            Ti.API.error(`Error deleting file: writable: ${photoPath.writable}`);
    }

    var result = photoPath.write(newThumbnail);
    if ( !result )
        Ti.API.error(`Error writing file: exists: ${photoPath.exists()}`);
  
    return photoPath.nativePath;
}

function generateUpload( blob ) {
    var uploadImage = blob;
    if ( OS_ANDROID ) {
        return blob;
    } else {
        return blob.imageAsCompressed( 0.9 );
    }
}

function setImage( image ) {
    if ( !image ) {
        $.photoSelectOptionalLabel.visible = true;
        $.magnify.visible = false;
        return;
    } 
    
    $.photoSelectOptionalLabel.visible = false;
    $.magnify.visible = true;
    if ( Array.isArray(image) ) {
        $.photo.image = image[0];
        $.photoUrls = image;
    } else if ( typeof(image) === "object" ) {
        $.photo.image = generateThumbnail( image.media );
        $.photoUrls = [$.photo.image];
    } else {
        $.photo.image = image;
        $.photoUrls = [image];
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
                autorotate: false,
                success: function (result) {
                    setImage( result );
                    $.trigger("photoTaken", generateUpload( result.media ) );
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
