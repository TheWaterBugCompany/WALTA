
var imgUrl = $.args.image;
var refId = $.args.refId;

$.SpeedbugTile.width = $.args.width;
$.SpeedbugTile.height = $.args.height;
$.SpeedbugTile.left = $.args.gap;
$.SpeedbugTile.right = $.args.gap;
function cleanUp() {
    $.destroy();
    $.off();
}

function clickEvent(e) {
    $.trigger("select", refId );
    e.cancelBubble = true;
}

function releaseImageData() {
    $.SpeedbugTile.removeAllChildren();
}

function showImageData() {
    if ( $.SpeedbugTile.children.length === 0 ) {
        $.SpeedbugTile.add( 
            Ti.UI.createImageView({
                image: imgUrl,
                width: $.args.width,
                height: $.args.height,
                accessibilityLabel: `Speedbug ${refId}`
             }) );
    }
}

exports.releaseImageData = releaseImageData;
exports.showImageData = showImageData;
exports.cleanUp = cleanUp;
