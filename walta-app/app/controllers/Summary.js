var Topics = require('ui/Topics');
var SampleSync = require('logic/SampleSync');
var GeoLocationService = require('logic/GeoLocationService');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Summary";
$.name = "summary";

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
        $.disableControl($.doneButton);
        $.message.text = INCOMPLETE_NO_LOCK;
        $.message.color = "red";
    } else {
        $.enableControl($.doneButton);
        setMessageText();
        $.message.color = "#70Ad47";
    }
}

function setMessageText() {
    
    if ( !Alloy.Globals.CerdiApi.retrieveUserToken() ) {
        $.message.text = COMPLETE_NOT_REGISTERED
        $.doneButton.title= "Submit";
    } else {
        $.message.text = COMPLETE
        $.doneButton.title= "Submit";
    }
}

Alloy.Models.sample.on("change", checkGpsLock );	
Alloy.Models.sample.trigger("change");

