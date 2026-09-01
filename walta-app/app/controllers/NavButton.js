var Topics = require('ui/Topics');
var { disableControl, enableControl } = require("ui/ViewUtils");

var topic = null;

function setLabel( s ) {
    $.label.text = s.toUpperCase();
    $.label.accessibilityLabel = s; 
}

// Height follows the image so the arrow keeps the proportions it was drawn in;
// pinning both dimensions stretches the arrowhead to the button's height.

// The label takes the space the icon leaves and centres its text in it, so the
// gap either side of the word stays even whatever the word is.
var ICON_SPAN = "32%";
function fillBesideIcon( iconSide ) {
    $.label.width = Ti.UI.FILL;
    $.label[ iconSide ] = ICON_SPAN;
}
function setIconLeft( img ) {
    $.icon = Ti.UI.createImageView( { image: img, left: "6dp", width: "26%", height: Ti.UI.SIZE } );
    fillBesideIcon( "left" );
    $.button.insertAt( { view: $.icon, position: 0 } );
}

function setIconRight( img ) {
    $.icon = Ti.UI.createImageView( { image: img, right: "6dp", width: "26%", height: Ti.UI.SIZE } );
    fillBesideIcon( "right" );
    $.button.add( $.icon );
}

function setTopic( t ) {
    topic = t;
}

function enable() {
    enableControl($.button);
    if ( $.icon ) {
        $.icon.tintColor = "white";
    }
    $.label.color = "white";
}

function disable() {
    disableControl($.button);
    if ( $.icon ) {
        $.icon.tintColor = "#35869c";
    }
    $.label.color = "#35869c";
    $.button.backgroundColor = "#5ca1b1";
    $.button.borderColor = "#5ca1b1";
}

function isEnabled() {
    return $.button.touchEnabled;
}

function cleanUp() {
    $.destroy();
    $.off();
    $.NavButton.removeEventListener( 'click', clickButton);
}
function clickButton(e) {
    if ( $.button.enabled === undefined || $.button.enabled ) {
        $.trigger("click", $.args);
    }
    e.cancelBubble = true;
} 
$.NavButton.addEventListener( 'click', clickButton);

exports.isEnabled = isEnabled;
exports.cleanUp = cleanUp;
exports.enable = enable;
exports.disable = disable;
exports.setTopic = setTopic;
exports.setLabel = setLabel;
exports.setIconLeft = setIconLeft;
exports.setIconRight = setIconRight;