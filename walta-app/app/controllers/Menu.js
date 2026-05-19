var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.name = "home";
if (Alloy.CFG.environment === "production") {
  $.appVersion.text = `v${Ti.App.version}`;
} else {
  $.appVersion.text = `Test Server v${Ti.App.version}`;
  $.appVersion.color = Alloy.CFG.colors.errorDark;
}
// WB-89: tag each Menu instance so multi-instance traces are readable.
var __menuInstanceId = `M${Date.now().toString(36)}${Math.floor(Math.random()*1e4).toString(36)}`;
Ti.API.info(`[WB89-Menu ${__menuInstanceId}] init; token=${!!Alloy.Globals.CerdiApi.retrieveUserToken()}`);

// Refresh the login label whenever auth state changes — lets the menu stay
// correct without needing to be recreated (which Navigation.openController
// won't do anyway when Menu is already current; see WB-67).
function onLoggedIn() {
  Ti.API.info(`[WB89-Menu ${__menuInstanceId}] LOGGEDIN received; token=${!!Alloy.Globals.CerdiApi.retrieveUserToken()}`);
  updateLoginText();
}
Topics.subscribe(Topics.LOGGEDIN, onLoggedIn);

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  Ti.API.info(`[WB89-Menu ${__menuInstanceId}] close — unsubscribing LOGGEDIN`);
  Topics.unsubscribe(Topics.LOGGEDIN, onLoggedIn);
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
  closeSelectMethod();
});


function logOut() {
  Alloy.Globals.CerdiApi.storeUserToken(null, null);
  Topics.fireTopicEvent( Topics.LOGGEDOUT, null );
  updateLoginText();
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
  $.mayflyMap = Alloy.createController("MayflyEmergenceMap");
  $.TopLevelWindow.add($.mayflyMap.getView());
  $.mayflyMap.on("close", function handler() {
      $.mayflyMap.off("close", handler);
      $.TopLevelWindow.remove($.mayflyMap.getView());
      $.mayflyMap.cleanUp();
      $.mayflyMap = null;
  });
}

function detailedClick() {
  Topics.fireTopicEvent( Topics.DETAILED, null );
}

function closeSelectMethod() {
  if ( $.selectMethod ) {
    $.TopLevelWindow.remove($.selectMethod.getView());
    $.selectMethod.cleanUp();
  }
}

function identifyClick() {
  $.selectMethod = Alloy.createController("MethodSelect");
  $.selectMethod.on("close", function() {
    closeSelectMethod();
  });

  $.selectMethod.on("keysearch", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.KEYSEARCH, { allowAddToSample: false, surveyType: null } );
  });

  $.selectMethod.on("speedbug", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.SPEEDBUG, { allowAddToSample: false, surveyType: null } );
  });

  $.selectMethod.on("browselist", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.BROWSE,  { allowAddToSample: false, surveyType: null } );
  });

  $.TopLevelWindow.add($.selectMethod.getView());
}

function historyClick() {
  Topics.fireTopicEvent( Topics.HISTORY );
}

function galleryClick() {
  Topics.fireTopicEvent( Topics.GALLERY, { showPager: false }  );
}

function aboutClick() {
  Topics.fireTopicEvent( Topics.ABOUT, null );
}

function helpClick() {
  Topics.fireTopicEvent( Topics.HELP, null );
}

function updateLoginText() {
  var hasToken = !!Alloy.Globals.CerdiApi.retrieveUserToken();
  Ti.API.info(`[WB89-Menu ${__menuInstanceId}] updateLoginText; token=${hasToken}`);
  if ( hasToken ) {
      $.logInLabel.text = "You are Logged in";
      $.logInLabel.accessibilityLabel = "You are Logged in";
  }
  else
  {
      $.logInLabel.text = "Log In";
      $.logInLabel.accessibilityLabel = "Log In";
  }
}
updateLoginText();