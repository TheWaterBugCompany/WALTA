var Topics = require('ui/Topics');

function logInClick() {
  if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
    Alloy.Globals.CerdiApi.storeUserToken(null);
    $.logInLabel.text = "Log In";
  } else {
    Topics.fireTopicEvent( Topics.LOGIN, null );
  }
}

function mayflyClick() {
  Topics.fireTopicEvent( Topics.MAYFLY, null );
}

function detailedClick() {
  Topics.fireTopicEvent( Topics.DETAILED, null );
}

function browseClick() {
  Topics.fireTopicEvent( Topics.BROWSE, null );
}

function galleryClick() {
  Topics.fireTopicEvent( Topics.GALLERY, null );
}

function aboutClick() {
  Topics.fireTopicEvent( Topics.ABOUT, null );
}

function helpClick() {
  Topics.fireTopicEvent( Topics.HELP, null );
}

if ( Alloy.Globals.CerdiApi.retrieveUserToken() )
    $.logInLabel.text = "You are Logged in";
else
    $.logInLabel.text = "Log In";

Alloy.createController("TopLevelWindow", {
  name: 'home',
  uiObj: { view: $.getView() }
});