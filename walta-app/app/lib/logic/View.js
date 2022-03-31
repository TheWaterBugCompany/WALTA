
var Topics = require('ui/Topics');
var debug = m => Ti.API.info(m);
let currentController = null;
let saveOrDiscard = null;

function DialogCancelled() {
}

function View(services) {
  this.services = services
}

View.prototype.getSaveOrDiscard = function() { return saveOrDiscard; }
View.prototype.getCurrentController = function() { return currentController; }

View.prototype.openView = function(ctl,args) {
  return new Promise( (resolve) => {
    debug(`opening controller="${ctl}" with args.readonly= ${args.readonly}`);
    currentController = Alloy.createController(ctl,args);
    currentController.on("window-opened", resolve);
    currentController.open();
  });
}

View.prototype.askDiscardEdits = function () {
  var me = this;
  return new Promise(function (resolve, reject) {
    var message;
    var buttons;
    var cancel;
    var discard;
    var submit;

    if ( me.services.Survey.isNewSurvey() ) {
      message = "The current sample has unsaved edits, but is not yet ready to submit, do you want to discard this survey?";
      cancel = 0;
      discard = 1;
      buttons = ['Cancel','Discard'];
    } else {
      message = "The current sample has unsaved edits, do you want to discard or submit these changes?";
      cancel = 0;
      discard =1;
      submit = 2;
      buttons = ['Cancel','Discard','Submit'];
    }
    saveOrDiscard = Ti.UI.createAlertDialog({
      persistent: true,
      cancel: cancel,
      message: message,
      title: "Unsaved Changes",
      buttonNames: buttons
    });

    saveOrDiscard.show();
    Topics.fireTopicEvent(Topics.DISCARD_OR_SAVE);
    saveOrDiscard.addEventListener('click', function (e) {
      saveOrDiscard.hide();
      debug(`index = ${e.index}`)
      if (e.index == saveOrDiscard.cancel ) {
        debug("cancelling dialog")
        reject( new DialogCancelled() );
      } else {
        var action = e.index==discard?'discard':'submit';
        debug(`${action} option chosen`);
        resolve(action);
      }
    });
  });
}

exports.View = View;
exports.DialogCancelled = DialogCancelled;