var Topics = require('ui/Topics');
var SampleSync = require('logic/SampleSync');
var GeoLocationService = require('logic/GeoLocationService');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Summary";
$.name = "summary";

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var acb = $.getAnchorBar(); 
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.SAMPLETRAY }  ); 
$.nextButton = Alloy.createController("NavButton");
$.nextButton.setLabel("Done");
$.nextButton.on("click", doneClick ) 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );

function doneClick() {
    saveSampleAndUpload();
    if ( Alloy.Globals.CerdiApi.retrieveUserToken() )
        Topics.fireTopicEvent( Topics.HOME, null );
    else
        Topics.fireTopicEvent( Topics.LOGIN, null );
}

var COMPLETE = "The survey is complete and will be uploaded in the background when internet access becomes available.";
var COMPLETE_NOT_REGISTERED = "The survey is complete. The next step is to register via the home screen and data will be uploaded in the background when internet access becomes available.";
var INCOMPLETE_NO_LOCK = "I haven't been able to obtain a GPS lock yet, please ensure you have location enabled and move to out into the open to allow the coordinates to be collected.";

var saveSampleAndUpload = function() {
    Alloy.Models.sample.saveCurrentSample();
    SampleSync.forceUpload();
    GeoLocationService.stop();
};

function checkGpsLock() {
    if ( !(Alloy.Models.sample.get("lat") && Alloy.Models.sample.get("lng") ) ) {
        $.nextButton.disable();
        $.message.text = INCOMPLETE_NO_LOCK;
        $.message.color = "red";
    } else {
        $.nextButton.enable();
        setMessageText();
        $.message.color = "#70Ad47";
    }
}

function setMessageText() {
    
    if ( !Alloy.Globals.CerdiApi.retrieveUserToken() ) {
        $.message.text = COMPLETE_NOT_REGISTERED
    } else {
        $.message.text = COMPLETE
    }
    $.nextButton.setLabel("Submit");
}

Alloy.Models.sample.on("change", checkGpsLock );	
Alloy.Models.sample.trigger("change");

