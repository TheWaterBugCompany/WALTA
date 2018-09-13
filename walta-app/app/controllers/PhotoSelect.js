// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
$.photoSelect.width = $.args.width;
$.photoSelect.height = $.args.height;
$.photo.image = $.args.image;

function setImage( image ) {
    $.photo.image = image;
}

exports.setImage = setImage;
