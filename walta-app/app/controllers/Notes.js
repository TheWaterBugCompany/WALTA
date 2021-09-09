exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Notes";
$.name = "notes";

var Topics = require("ui/Topics");
var sample = Alloy.Models.sample;
var readOnlyMode = $.args.readonly === true;

if ( readOnlyMode ) { 
    $.partialToggle.enabled = false;
    $.notesTextField.editable = false;

}

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.notesTextField ] );

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
    let ten = $.innerContent.rect.y;
    let height = $.TopLevelWindow.size.height - acb.size.height;
    let width = $.innerContent.size.width;
    let toggleWidth = $.partialToggle.size.width;

    let partialHeight = $.partial.size.height;
    $.partial.height = partialHeight; 
    $.content.height = height;
    $.partialLabel.left = toggleWidth + ten; 
    $.partialLabel.width = width - (toggleWidth + ten);

  //  Ti.API.info(`win = ${$.TopLevelWindow.size.height}`);
  //  Ti.API.info(`acb = ${acb.size.height}`);
  //  Ti.API.info(`partial = ${$.partial.size.height}`);
   // Ti.API.info(`ten = ${ten}`)

    let notesWidth = $.TopLevelWindow.size.width - ten*3;

  //  Ti.API.info(`notesTextField y = ${$.notesTextField.rect.y}`)
    let notesHeight = height - partialHeight - ten*2;
    let notesLabelHeight = $.notesLabel.size.height;

  //  Ti.API.info(`notesWidth = ${notesWidth}`);
  //  Ti.API.info(`notesHeight = ${notesHeight}`);
  //  Ti.API.info(`notesLabelHeight = ${notesLabelHeight}`);
 
    $.notes.height = notesHeight;
    $.notesTextField.width = notesWidth;
    $.notesTextField.height = notesHeight - $.notesTextField.rect.y - ten;
}
$.notesTextField.addEventListener('postlayout', fixUpScrollview);

function updateFields() {
    $.partialToggle.value = Boolean(sample.get("complete"));
    $.notesTextField.value = sample.get("notes");
}

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
updateFields();

