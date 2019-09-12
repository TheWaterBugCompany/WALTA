function cleanUp() {
    $.destroy();
    $.off();
}

function clickEvent(e) {
    $.args.action(e);
}

$.icon.backgroundImage = $.args.image;
$.label.text = $.args.label;
$.icon.accessibilityLabel = $.args.label;

exports.cleanUp = cleanUp;
