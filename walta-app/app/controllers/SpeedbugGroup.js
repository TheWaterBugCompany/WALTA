var { makeAccessibilityLabel } = require('ui/ViewUtils');
function cleanUp() {
    $.destroy();
    $.off();
}

var refId = $.args.refId;
var tileWidth = $.args.tileWidth;
var tileHeight = $.args.tileHeight;
var tileGap = $.args.tileGap;
var index = $.args.index;
$.args.speedbugs.forEach( (sb) => addTile( sb ) );

function clickEvent(e) {
    $.trigger("select", refId );
    e.cancelBubble = true;
}

function addTile(sb) {
    var tile = Alloy.createController("SpeedbugTile", { 
        refId: sb.refId,
        image: sb.imgUrl,
        width: tileWidth,
        height: tileHeight,
        gap: tileGap,
     } );
    tile.on("select", (refId) => $.trigger("select", refId ) );
    index.pushTile( tile );
    $.bugContainer.add( tile.getView() );
    $.notSureButton.accessibilityLabel = makeAccessibilityLabel("speedbug_not_sure", refId);
    if ( $.bugContainer.children.length > 1 ) {
        $.notSureButton.visible = true;
    } else {
        $.notSureButton.visible = false;
    }
}

$.SpeedbugGroup.width = $.bugContainer.children.length*(tileWidth+tileGap*2);

exports.cleanUp = cleanUp; 
exports.addTile = addTile;
