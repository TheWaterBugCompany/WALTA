var chosen = $.args.date || new Date();

function fitPickerToCard() {
    $.pickerWindow.removeEventListener("postlayout", fitPickerToCard);
    var natural = $.datePicker.rect.height;
    var available = $.pickerCard.rect.height - $.titleBar.rect.height
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
