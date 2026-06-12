var chosen = $.args.date || new Date();

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
