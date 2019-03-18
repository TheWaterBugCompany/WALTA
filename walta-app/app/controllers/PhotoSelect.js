// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
$.photoSelect.left = $.args.left;
$.photoSelect.right = $.args.right;
$.photoSelect.top = $.args.top;
$.photoSelect.bottom = $.args.bottom;
$.photoSelect.width = $.args.width;
$.photoSelect.height = $.args.height;
$.photo.image = $.args.image;

function generateThumbnail( blob ) {
    var thumbnailImage = Ti.UI.createImageView( { image: blob } ).toBlob();
    var pxWidth = Ti.UI.convertUnits( `${$.photoSelect.size.width}dp`, Ti.UI.UNIT_PX );
    var pxHeight = Ti.UI.convertUnits( `${$.photoSelect.size.height}dp`, Ti.UI.UNIT_PX );
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
    if ( typeof(image) === "object" ) {
        // check to see if we've been rendered yet - if not defer creating thumbnail
        // until we are.
        if ( $.photo.size.width === 0 && $.photo.size.height === 0 ) {
            $.photoSelect.addEventListener( "postlayout", function loadImage() {
                $.photoSelect.removeEventListener( "postlayout", loadImage );
                $.photo.image = generateThumbnail( image );
            });
        } else {
            $.photo.image = generateThumbnail( image );
        }
        
    } else {
        $.photo.image = image;
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

function takePhoto() {
    if ( !$.disabled )  {
        requestCameraPermissions(
            function success() {
                Ti.Media.showCamera({
                    autohide: true,
                    success: function (result) {
                        $.photo.image = generateThumbnail( result.media );
                        $.trigger("photoTaken", generateUpload(result.media) );
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
    };
    
} 

function disable() {
    $.disabled = true;
}

function enable() {
    $.disabled = false;
}

exports.setImage = setImage;
exports.disable = disable;
exports.enable = enable;
