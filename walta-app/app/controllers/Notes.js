exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Notes";
$.name = "notes";

var Topics = require("ui/Topics");
var NotesViewModel = require("viewmodels/Notes");
var bindView = require("util/bindView");

var readOnlyMode = $.args.readonly === true;
var vm = new NotesViewModel({ sample: Alloy.Models.sample, readonly: readOnlyMode });

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.notesTextField ] );

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton",    { topic: Topics.SAMPLETRAY, slide: "left",  readonly: readOnlyMode });
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.COMPLETE,   slide: "right", readonly: readOnlyMode });
acb.addTool( $.backButton.getView() );
acb.addTool( $.nextButton.getView() );

bindView($, vm, {
    surveyDateValue: { text: "surveyDateLabel" },
    partialToggle:   { enabled: "editable" },
    notesTextField:  { editable: "editable" },
});

// Seeded once, not bound: re-pushing a TextArea's value on every
// keystroke-driven notify would fight the cursor; the Switch likewise only
// needs its initial value — user toggles flow back through onPartialChange.
$.partialToggle.value = vm.complete;
$.notesTextField.value = vm.notes;

function onPartialChange( e ) { vm.setComplete( e.value ); }
function onNotesChange( e )   { vm.setNotes( e.value ); }

var surveyDatePicker = null;
var surveyDateModal = null;

function selectSurveyDate( date ) { vm.setSurveyDate( date ); }

// Ti has no cross-platform modal date picker: Android exposes a native
// dialog, iOS needs the picker embedded in a dismissable sheet we build here.
function onSurveyDateClick() {
    if ( !vm.editable ) return;
    if ( OS_ANDROID ) {
        surveyDatePicker = Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE });
        surveyDatePicker.showDatePickerDialog({
            value: vm.surveyDate,
            callback: function ( e ) { if ( !e.cancel && e.value ) selectSurveyDate( e.value ); }
        });
    } else {
        openIosDatePicker();
    }
}

function openIosDatePicker() {
    var chosen = vm.surveyDate;
    // Force the graphical calendar inline: the default compact style renders a
    // tappable date field, so the user would have to tap twice to reach the
    // calendar (once to open the sheet, again to expand the field).
    surveyDatePicker = Ti.UI.createPicker({
        type: Ti.UI.PICKER_TYPE_DATE,
        value: vm.surveyDate,
        datePickerStyle: Ti.UI.iOS.DATE_PICKER_STYLE_INLINE,
        width: Ti.UI.FILL
    });
    surveyDatePicker.addEventListener("change", function ( e ) { chosen = e.value; });

    var doneButton = Ti.UI.createButton({ title: "Done", right: "12dp" });
    var toolbar = Ti.UI.createView({ height: "44dp", width: Ti.UI.FILL, backgroundColor: "#f2f2f2" });
    toolbar.add( doneButton );

    var sheet = Ti.UI.createView({ bottom: 0, height: Ti.UI.SIZE, width: Ti.UI.FILL, backgroundColor: "white", layout: "vertical" });
    sheet.add( toolbar );
    sheet.add( surveyDatePicker );

    surveyDateModal = Ti.UI.createWindow({ backgroundColor: "rgba(0,0,0,0.4)" });
    surveyDateModal.add( sheet );
    doneButton.addEventListener("click", function () { selectSurveyDate( chosen ); surveyDateModal.close(); });
    surveyDateModal.open();
}

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    if ( surveyDateModal ) surveyDateModal.close();
    vm.dispose();
    $.destroy();
    $.off();
});

exports.selectSurveyDate = selectSurveyDate;
exports.getSurveyDatePicker = function () { return surveyDatePicker; };
