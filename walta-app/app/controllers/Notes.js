exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Notes";
$.name = "notes";

var Topics = require("ui/Topics");
var sample = Alloy.Models.sample;
var readOnlyMode = $.args.readonly === true;
$.TopLevelWindow.useUnSafeArea = true;
if ( readOnlyMode ) { 
    $.partialToggle.enabled = false;
    $.notesTextField.editable = false; 
}

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.notesTextField ] );

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    $.destroy();
    $.off();
});

function updateFields() {
    $.partialToggle.value = Boolean(sample.get("complete"));
    $.notesTextField.value = sample.get("notes");
}

function onPartialChange( data ) {
    sample.set("complete", data.value );
    sample.save();
}

function onNotesChange( data ) {
    sample.set("notes", data.value );
    sample.save();
}

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.SAMPLETRAY, slide: "left", readonly: readOnlyMode  }  ); 
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.COMPLETE, slide: "right", readonly: readOnlyMode  } ); 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );
updateFields();
