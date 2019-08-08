var Topics = require('ui/Topics');
exports.baseController  = "TopLevelWindow";
$.name = "home";

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  Ti.API.info("closing Menu");
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
  closeSelectMethod();
});


function logOut() {
  Alloy.Globals.CerdiApi.storeUserToken(null);
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
  $.selectMethod = Alloy.createController("MayflyMusterSelect");
  $.TopLevelWindow.add($.selectMethod.getView());
  $.selectMethod.on("close", function() {
    closeSelectMethod();
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
  if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
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