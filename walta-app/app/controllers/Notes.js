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

// Nav buttons route through the VM so the screen's back/next intent lives in
// one place; the controller maps the VM's events onto Topics.
var acb = $.getAnchorBar();
$.backButton = Alloy.createController("NavButton");
$.backButton.setLabel("Back");
$.backButton.setIconLeft("/images/icon-go-back.png");
$.nextButton = Alloy.createController("NavButton");
$.nextButton.setLabel("Next");
$.nextButton.setIconRight("/images/icon-go-forward.png");
acb.addTool( $.backButton.getView() );
acb.addTool( $.nextButton.getView() );

bindView($, vm, {
    surveyDateValue: { text: "surveyDateLabel" },
    partialToggle:   { enabled: "editable" },
    notesTextField:  { editable: "editable" },
    backButton:      { onClick: "goBack" },
    nextButton:      { onClick: "goForward" },
});

// Seeded once, not bound: re-pushing a TextArea's value on every
// keystroke-driven notify would fight the cursor; the Switch likewise only
// needs its initial value — user toggles flow back through onPartialChange.
$.partialToggle.value = vm.complete;
$.notesTextField.value = vm.notes;

vm.on("back",    function () { Topics.fireTopicEvent( Topics.SAMPLETRAY, { slide: "left",  readonly: readOnlyMode } ); });
vm.on("forward", function () { Topics.fireTopicEvent( Topics.COMPLETE,   { slide: "right", readonly: readOnlyMode } ); });

function onPartialChange( e ) { vm.setComplete( e.value ); }
function onNotesChange( e )   { vm.setNotes( e.value ); }

function selectSurveyDate( date ) { vm.setSurveyDate( date ); }

// Ti has no cross-platform modal date picker: Android exposes a native
// dialog, iOS needs the wheel embedded in a dismissable sheet we build here.
function onSurveyDateClick() {
    if ( !vm.editable ) return;
    if ( OS_ANDROID ) {
        Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE }).showDatePickerDialog({
            value: vm.surveyDate,
            callback: function ( e ) { if ( !e.cancel && e.value ) selectSurveyDate( e.value ); }
        });
    } else {
        showIosDatePicker();
    }
}

function showIosDatePicker() {
    var chosen = vm.surveyDate;
    var picker = Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE, value: vm.surveyDate, width: Ti.UI.FILL });
    picker.addEventListener("change", function ( e ) { chosen = e.value; });

    var doneButton = Ti.UI.createButton({ title: "Done", right: "12dp" });
    var toolbar = Ti.UI.createView({ height: "44dp", width: Ti.UI.FILL, backgroundColor: "#f2f2f2" });
    toolbar.add( doneButton );

    var sheet = Ti.UI.createView({ bottom: 0, height: Ti.UI.SIZE, width: Ti.UI.FILL, backgroundColor: "white", layout: "vertical" });
    sheet.add( toolbar );
    sheet.add( picker );

    var modal = Ti.UI.createWindow({ backgroundColor: "rgba(0,0,0,0.4)" });
    modal.add( sheet );
    doneButton.addEventListener("click", function () { selectSurveyDate( chosen ); modal.close(); });
    modal.open();
}

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    vm.dispose();
    $.destroy();
    $.off();
});

exports.selectSurveyDate = selectSurveyDate;
