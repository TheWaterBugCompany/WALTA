exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Notes";
$.name = "notes";

var Topics = require("ui/Topics");
var NotesViewModel = require("viewmodels/Notes");
var bindView = require("util/bindView");
var SurveyDatePickerPresenter = require("logic/SurveyDatePickerPresenter");

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

function onPartialChange( e ) { vm.complete = e.value; }
function onNotesChange( e )   { vm.notes = e.value; }

function selectSurveyDate( date ) { vm.surveyDate = date; }

function onSurveyDateClick() {
    if ( !vm.editable || $.surveyDatePicker ) return;
    $.surveyDatePicker = SurveyDatePickerPresenter.open({
        window: $.TopLevelWindow,
        date: vm.surveyDate,
        onSelected: selectSurveyDate,
        onClose: closeSurveyDatePicker,
    });
}

function closeSurveyDatePicker() {
    if ( !$.surveyDatePicker ) return;
    $.surveyDatePicker.close();
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
