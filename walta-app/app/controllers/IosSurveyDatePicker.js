var chosen = $.args.date || new Date();

// The inline picker draws its calendar at one fixed natural height whatever
// frame it is given — taller, in landscape, than the card has room for. Only a
// transform scales it, and a transform shrinks what is drawn without giving back
// the layout space the picker claims, so sizing the picker itself pushed the
// button bar off the card or back up over the last row of dates. Instead the
// frame is given the room left between the two bars and the calendar is scaled
// into it. Both are measured on the first layout rather than assumed: the same
// card has to fit landscape heights from an SE to a Pro Max. Titanium glue with
// no view-model expression — a 2D matrix is not something bindView can carry.
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
