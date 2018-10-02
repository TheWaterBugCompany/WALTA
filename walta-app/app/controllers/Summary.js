var Topics = require('ui/Topics');
var SampleSync = require('logic/SampleSync');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Summary";

function doneClick() {
    if ( Alloy.Globals.CerdiApi.retrieveUserToken() )
        Topics.fireTopicEvent( Topics.HOME, null );
    else
        Topics.fireTopicEvent( Topics.LOGIN, null );
}

var COMPLETE = "Congratulations you've completed your survey!\n\nThe survey has been queued for upload and will be sent as a background task to the Waterbug Blitz servers when internet access becomes available.";

var COMPLETE_NOT_REGISTERED = "Congratulations you've completed your survey!\n\n"
+ "The survey has been queued for upload.\n\nThe next step is to register via the home screen and data will be sent "
+ "as a background task to the Waterbug Blitz servers when internet access becomes available.";

var INCOMPLETE_NO_LOCK = "The survey is complete!\n\n"
+ "However, I haven't been able to obtain a GPS lock yet, please ensure you have location enabled and"
+ " move to out into the open to allow the coordinates to be collected.";

// We only want to do this once each time this screen is displayed...
var saveSampleAndUpload = _.once(function() {
    Alloy.Models.sample.saveCurrentSample();
    SampleSync.forceUpload(); // avoid the 30 minute wait if internet is available
    setMessageText();
    $.gpsObtained.visible = true;
    $.enable($.doneButton);
})

function checkGpsLock() {
    if ( !(Alloy.Models.sample.get("lat") && Alloy.Models.sample.get("lng") ) ) {
        $.disable($.doneButton);
        $.message.text = INCOMPLETE_NO_LOCK;
        $.gpsObtained.visible = false;
    } else {
        saveSampleAndUpload();
    }
}

function setMessageText() {
    if ( !Alloy.Globals.CerdiApi.retrieveUserToken() ) {
        $.message.text = COMPLETE_NOT_REGISTERED
        $.doneButton.title= "Register";
    } else {
        $.message.text = COMPLETE
        $.doneButton.title= "Done";
    }
}

Alloy.Models.sample.on("change", checkGpsLock );	
Alloy.Models.sample.trigger("change");
