var Topics = require('ui/Topics');
var { disableControl, enableControl } = require("ui/ViewUtils");

var topic = null;

function setLabel( s ) {
    $.label.text = s.toUpperCase();
    $.label.accessibilityLabel = s; 
}

function setIconLeft( img ) {
    $.icon = Ti.UI.createImageView( { image: img, id: "icon", left: "4dp", width: "18%", height: "100%" } );
    $.button.insertAt( { view: $.icon, position: 0 } );
}

function setIconRight( img ) {
    $.icon = Ti.UI.createImageView( { image: img, id: "icon", right: "4dp", width: "18%", height: "100%" } );
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

exports.cleanUp = cleanUp;
exports.enable = enable;
exports.disable = disable;
exports.setTopic = setTopic;
exports.setLabel = setLabel;
exports.setIconLeft = setIconLeft;
exports.setIconRight = setIconRight;