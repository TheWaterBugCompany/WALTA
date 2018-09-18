var Topics = require('ui/Topics');
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Summary";
function doneClick() {
    Topics.fireTopicEvent( Topics.HOME, null );
}
if ( !Alloy.Globals.CerdiApi.retrieveUserToken() )
    $.message.text = "Congratulations you've completed your survey!\n\n"
        + "The survey has been queued for upload.\n\nThe next step is to register via the home screen and data will be sent "
        + "as a background task to the Waterbug Blitz servers when internet access becomes available.";
	
