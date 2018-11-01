var Topics = require('ui/Topics');
exports.baseController  = "TopLevelWindow";
$.name = "home";

function logOut() {
  Alloy.Globals.CerdiApi.storeUserToken(null);
  $.logInLabel.text = "Log In";
}

function logInClick() {
  if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
    var dialog = Ti.UI.createAlertDialog({
      message: 'Are you sure you want to log out?',
      cancel: 1,
      buttonNames: [ 'Log Out', 'Cancel' ],
      title: 'Confirm Log Out'
    });
    dialog.addEventListener('click', function(e) {
      if (e.index === 0) {
        logOut();
      }
    });
    dialog.show();
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

function identifyClick() {
  $.selectMethod = Alloy.createController("MethodSelect");
  function closeSelectMethod() {
    $.TopLevelWindow.remove($.selectMethod.getView());
  }

  $.selectMethod.on("close", function() {
    closeSelectMethod();
  });

  $.selectMethod.on("keysearch", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.KEYSEARCH, false );
  });

  $.selectMethod.on("speedbug", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.SPEEDBUG, { allowAddToSample: false, speedbugName: "Speedbug" } );
  });

  $.selectMethod.on("browselist", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.BROWSE, false );
  });

  $.TopLevelWindow.add($.selectMethod.getView());
}

function historyClick() {
  Topics.fireTopicEvent( Topics.HISTORY, null );
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