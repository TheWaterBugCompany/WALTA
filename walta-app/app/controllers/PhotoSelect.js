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
    var pxWidth = Ti.UI.convertUnits( $.photoSelect.size.width, Ti.UI.UNIT_PX );
    var pxHeight = Ti.UI.convertUnits( $.photoSelect.size.height, Ti.UI.UNIT_PX );
    var newHeight = pxWidth*(thumbnailImage.height/thumbnailImage.width);
    thumbnailImage = thumbnailImage.imageAsResized( pxWidth, newHeight );
    return thumbnailImage.imageAsCropped( { width: pxWidth, height: pxHeight, x:0, y:((newHeight-pxHeight)/2) });
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
    requestCameraPermissions(
        function success() {
            Ti.Media.showCamera({
                autohide: true,
                success: function (result) {
                    var blob = result.media;
                    $.photo.image = generateThumbnail(blob);
                    $.trigger("photoTaken", blob);
                },
                error: function (error) {
                    alert(`${error.error}`); 
                },
                saveToPhotoGallery: true,
                whichCamera: Titanium.Media.CAMERA_FRONT,
                mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
            });
        },

        function failure() {
            alert("Unable to get permissions for the camera, please allow camera permissions to take photos");
        }

    )
    
} 


exports.setImage = setImage;
