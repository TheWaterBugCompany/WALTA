// iOS has no native modal date dialog, so the survey date is chosen through the
// IosSurveyDatePicker overlay (an inline calendar). open() returns a handle the
// caller holds to tear the modal down; datePicker is exposed for introspection.
function open({ window, date, onSelected, onClose }) {
    var modal = Alloy.createController("IosSurveyDatePicker", { date });
    window.add( modal.getView() );
    modal.on("selected", ( e ) => onSelected( e.value ));
    modal.on("close", onClose);
    return {
        datePicker: modal.datePicker,
        close: function () {
            modal.off();
            window.remove( modal.getView() );
            modal.cleanUp();
        },
    };
}

exports.open = open;
