exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Notes";
$.name = "notes";

var Topics = require("ui/Topics");
var sample = Alloy.Models.sample;
var readOnlyMode = $.args.readonly === true;

if ( readOnlyMode ) {
    //$.leaves.editable = false;

}
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    $.notes.removeEventListener('postlayout', fixUpNotesView );
    $.TopLevelWindow.removeEventListener('postlayout', fixUpScrollview );
    $.destroy();
    $.off();
});
function fixUpNotesView() {
    let notesWidth = $.notes.size.width;
    let notesHeight = $.notes.size.height;
    let notesLabelHeight = $.notesLabel.size.height;
    $.notesTextField.width = notesWidth - 20;
    $.notesTextField.height = notesHeight - notesLabelHeight - 20;
}
function fixUpScrollview() {
    let acb = $.getAnchorBar().getView();
    let height = $.TopLevelWindow.size.height - acb.size.height;
    let partialHeight = $.partialToggle.size.height;
    $.partial.height = partialHeight;
    $.content.height = height;
    $.notes.height = height - partialHeight- 20;
}
$.TopLevelWindow.addEventListener('postlayout', fixUpScrollview);
$.notes.addEventListener('postlayout', fixUpNotesView);

function onPartialChange( data ) {
    sample.set("complete", data.value );
}

function onNotesChange( data ) {
    sample.set("notes", data.value );
}

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.SAMPLETRAY, slide: "left", readonly: readOnlyMode  }  ); 
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.COMPLETE, slide: "right", readonly: readOnlyMode  } ); 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );

