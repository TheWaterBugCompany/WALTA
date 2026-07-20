var Topics = require('ui/Topics');
var MenuViewModel = require("viewmodels/Menu");
var bindView = require("util/bindView");

exports.baseController  = "TopLevelWindow";
$.name = "home";

var vm = new MenuViewModel({
  cerdiApi: Alloy.Globals.CerdiApi,
  topics: Topics,
  environment: Alloy.CFG.environment,
  version: Ti.App.version
});

bindView($, vm, {
  appVersion:      { text: "versionLabel", color: "versionColor" },
  logInLabel:      { text: "loginLabel", accessibilityLabel: "loginLabel" },
  logInOrRegister: { onClick: "loginOrOut" },
  detailed:        { onClick: "detailed" },
  identify:        { onClick: "identify" },
  history:         { onClick: "history" },
  gallery:         { onClick: "gallery" },
  academy:         { onClick: "academy" },
  about:           { onClick: "about" }
}, Alloy.CFG.colors);

vm.on("identify", openSelectMethod);
vm.on("confirmLogout", confirmLogout);

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  vm.dispose();
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
  closeSelectMethod();
});

function confirmLogout() {
  var dialog = Ti.UI.createAlertDialog({
    message: 'Are you sure you want to log out?',
    cancel: 1,
    buttonNames: [ 'Log Out', 'Cancel' ],
    title: 'Confirm Log Out'
  });
  dialog.addEventListener('click', function(e) {
    if (e.index === 0) {
      vm.logOut();
    }
  });
  dialog.show();
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

function helpClick() {
  Topics.fireTopicEvent( Topics.HELP, null );
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
