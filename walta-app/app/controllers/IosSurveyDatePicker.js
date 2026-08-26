var chosen = $.args.date || new Date();

// The inline picker draws its calendar at a fixed natural height whatever frame
// it is given, and on a phone in landscape that was tall enough to push the Done
// button off the bottom of the card and slice it in half. iOS won't resize it —
// only a transform scales it — so the frame reserves the scaled height to match
// what is actually drawn. Titanium glue with no view-model expression: a
// 2D matrix is not something bindView can carry.
var PICKER_NATURAL_HEIGHT = 324;
var PICKER_SCALE = 0.8;

if (OS_IOS) {
    $.datePicker.transform = Ti.UI.create2DMatrix().scale(PICKER_SCALE);
    $.datePicker.height = (PICKER_NATURAL_HEIGHT * PICKER_SCALE) + "dp";
}

$.datePicker.value = chosen;
$.datePicker.addEventListener("change", function ( e ) { chosen = e.value; });

function doneClick() {
    $.trigger("selected", { value: chosen });
    $.trigger("close");
}

$.closeButton.on("close", () => $.trigger("close"));

function cleanUp() {
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
