var GalleryWindow = require('ui/GalleryWindow');

var args = $.args;
if ( $.args.left ) $.photoSelectInner.left = $.args.left;
if ( $.args.right ) $.photoSelectInner.right = $.args.right;
if ( $.args.top ) $.photoSelectInner.top = $.args.top;
if ( $.args.bottom ) $.photoSelectInner.bottom = $.args.bottom;
if ( $.args.width ) $.photoSelectBoundary.width = $.args.width;
if ( $.args.height ) $.photoSelectBoundary.height = $.args.height;
if ( $.args.image ) $.photo.image = $.args.image;

var readOnlyMode = $.args.readonly ;
if ( readOnlyMode ) {
    $.iconHolder.remove( $.camera );
}

function generateThumbnail( blob ) {
    var thumbnailImage = Ti.UI.createImageView( { image: blob } ).toBlob();
    var pxWidth = Ti.UI.convertUnits( `${$.photo.size.width}dp`, Ti.UI.UNIT_PX );
    var pxHeight = Ti.UI.convertUnits( `${$.photo.size.height}dp`, Ti.UI.UNIT_PX );
    var newHeight = pxWidth*(thumbnailImage.height/thumbnailImage.width);
    Ti.API.debug(`${pxWidth} ${pxHeight} ${newHeight}`);
    thumbnailImage = thumbnailImage.imageAsResized( pxWidth, newHeight );
    var cropY = ((newHeight-pxHeight)/2);
    if ( cropY > 0 )
        thumbnailImage = thumbnailImage.imageAsCropped( { width: pxWidth, height: pxHeight, x:0, y:cropY });
    return thumbnailImage;
}

function generateUpload( blob ) {
    var uploadImage = blob;
    Ti.API.debug(`image size width = ${uploadImage.width} height = ${uploadImage.height}`);
    if ( OS_ANDROID ) {
        return blob;
    } else {
        return blob.imageAsCompressed( 0.9 );
    }
}

function setImage( image ) {
    if ( Array.isArray(image) ) {
        $.photo.image = image[0];
        $.photoUrls = image;
    } else if ( typeof(image) === "object" ) {
        // check to see if we've been rendered yet - if not defer creating thumbnail
        // until we are.
        if ( $.photo.size.width === 0 && $.photo.size.height === 0 ) {
            $.photoSelect.addEventListener( "postlayout", function loadImage() {
                $.photoSelect.removeEventListener( "postlayout", loadImage );
                $.photo.image = generateThumbnail( image.media );
            });
        } else {
            $.photo.image = generateThumbnail( image.media );
        }
        
        // We need to save the photo thumbnail to a file path so that the photo gallery 
        // can read it via a URL
        var photoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, `tmp_preview_photo.jpg`);
        if ( photoPath.write(image.media) === false )
            alert("Error writing file");
        $.photoUrls = [photoPath.nativePath];
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
    var galleryWin = GalleryWindow.createGalleryWindow($.photoUrls);
    galleryWin.open();
}

function takePhoto() {
    if ( $.disabled) return;
    requestCameraPermissions(
        function success() {
            Ti.Media.showCamera({
                autohide: true,
                success: function (result) {
                    setImage( result );
                    $.trigger("photoTaken", generateUpload( result ) );
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
