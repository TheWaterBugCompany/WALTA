var chosen = $.args.date || new Date();

function fitPickerToCard() {
    $.pickerWindow.removeEventListener("postlayout", fitPickerToCard);
    var natural = $.datePicker.rect.height;
    // Measured against the screen, not the card: the card is sized by what it
    // holds, so asking it how much room there is would always answer "enough".
    var MARGIN = 12;
    var available = $.getView().rect.height - 2 * MARGIN - $.titleBar.rect.height
        - $.buttonBar.rect.height - parseFloat($.buttonBar.bottom);
    if (natural && available < natural) {
        $.datePicker.transform = Ti.UI.create2DMatrix().scale(available / natural);
        $.pickerFrame.height = available + "dp";
    }
    $.trigger("fitted");
}

if (OS_IOS) {
    $.pickerWindow.addEventListener("postlayout", fitPickerToCard);
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
