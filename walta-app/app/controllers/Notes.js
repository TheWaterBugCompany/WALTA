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
    partialToggle:   { value: "complete", enabled: "editable" },
    notesTextField:  { value: "notes", editable: "editable" },
});

function onPartialChange( e ) { vm.setComplete( e.value ); }
function onNotesChange( e )   { vm.setNotes( e.value ); }

function selectSurveyDate( date ) { vm.setSurveyDate( date ); }

// iOS has no native modal date dialog, so it gets the SurveyDatePicker overlay
// (inline calendar). Android's embedded date picker crashes inside Titanium's
// Material TextInputLayout, and the platform has a native dialog anyway.
function onSurveyDateClick() {
    if ( !vm.editable ) return;
    if ( OS_ANDROID ) {
        Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE }).showDatePickerDialog({
            value: vm.surveyDate,
            callback: function ( e ) { if ( !e.cancel && e.value ) selectSurveyDate( e.value ); }
        });
        return;
    }
    if ( $.surveyDatePicker ) return;
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
