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

function selectSurveyDate( date ) { vm.setSurveyDate( date ); }

function onSurveyDateClick() {
    if ( !vm.editable || $.surveyDatePicker ) return;
    $.surveyDatePicker = Alloy.createController("SurveyDatePicker", { date: vm.surveyDate });
    $.TopLevelWindow.add( $.surveyDatePicker.getView() );
    $.surveyDatePicker.on("selected", ( e ) => selectSurveyDate( e.value ));
    $.surveyDatePicker.on("close", closeSurveyDatePicker);
}

function closeSurveyDatePicker() {
    if ( !$.surveyDatePicker ) return;
    $.surveyDatePicker.off();
    $.TopLevelWindow.remove( $.surveyDatePicker.getView() );
    $.surveyDatePicker.cleanUp();
    $.surveyDatePicker = null;
}

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    closeSurveyDatePicker();
    vm.dispose();
    $.destroy();
    $.off();
});

exports.selectSurveyDate = selectSurveyDate;
