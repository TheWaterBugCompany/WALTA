var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.name = "home";

// Residual-Titanium shell. The Menu screen controller
// (lib/mvvm/controllers/Menu, instantiated by View.openView) builds the
// view-model and binds it; it routes the identify / confirm-logout intents to
// the two Ti actions exposed here — the MethodSelect overlay and the logout
// alert. See docs/patterns/screen-controllers.md.
$.openSelectMethod = openSelectMethod;
$.confirmLogout = confirmLogout;

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
  closeSelectMethod();
});

function confirmLogout(onConfirm) {
  var dialog = Ti.UI.createAlertDialog({
    message: 'Are you sure you want to log out?',
    cancel: 1,
    buttonNames: [ 'Log Out', 'Cancel' ],
    title: 'Confirm Log Out'
  });
  dialog.addEventListener('click', function(e) {
    if (e.index === 0) {
      onConfirm();
    }
  });
  dialog.show();
}

function closeSelectMethod() {
  if ( $.selectMethod ) {
    $.TopLevelWindow.remove($.selectMethod.getView());
    $.selectMethod.cleanUp();
  }
}

function openSelectMethod() {
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
