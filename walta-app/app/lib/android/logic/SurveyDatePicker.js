// Android has a native date dialog, and its embedded Ti.UI.Picker crashes inside
// Titanium's Material TextInputLayout — so the survey date is chosen through
// showDatePickerDialog. It is fire-and-forget: there is no modal to hold, so
// open() returns nothing and the caller has nothing to tear down.
function open({ date, onSelected }) {
    Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE }).showDatePickerDialog({
        value: date,
        callback: function ( e ) { if ( !e.cancel && e.value ) onSelected( e.value ); }
    });
}

exports.open = open;
