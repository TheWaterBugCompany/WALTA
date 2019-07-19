var { setAccessibilityLabel } = require('ui/ViewUtils');
function cleanUp() {
    $.destroy();
    $.off();
}

function clickEvent(e) {
    $.args.action(e);
}

$.icon.backgroundImage = $.args.image;
$.label.text = $.args.label;
setAccessibilityLabel( $.icon, "icon", $.args.label );

exports.cleanUp = cleanUp;
