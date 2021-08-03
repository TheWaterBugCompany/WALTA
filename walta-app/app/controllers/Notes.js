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
    $.destroy();
    $.off();
});

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.SAMPLETRAY, slide: "left", readonly: readOnlyMode  }  ); 
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.COMPLETE, slide: "right", readonly: readOnlyMode  } ); 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );

