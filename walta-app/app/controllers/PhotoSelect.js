// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
$.photoSelect.left = $.args.left;
$.photoSelect.right = $.args.right;
$.photoSelect.top = $.args.top;
$.photoSelect.bottom = $.args.bottom;
$.photoSelect.width = $.args.width;
$.photoSelect.height = $.args.height;
$.photo.image = $.args.image;

function setImage( image ) {
    $.photo.image = image;
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
                success: function (result) {
                    Ti.API.info( `got photo: ${JSON.stringify(result)}`);
                    $.photo.image = result.media;
                },
                error: function (error) {
                    alert(`${error.error}`);
                },
                saveToPhotoGallery: true,
                mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
            });
        },

        function failure() {
            alert("Unable to get permissions for the camera, please allow camera permissions to take photos");
        }

    )
    
} 


exports.setImage = setImage;
