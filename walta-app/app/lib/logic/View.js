
var Topics = require('ui/Topics');
const Logger = require("util/Logger");
const modalControllers = require("controllers/registry");

var debug = (m, tag = "ui") => Logger.log(m, tag);
let currentController = null;
let saveOrDiscard = null;
let currentModal = null;

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

// Overlay a modal on top of the current window. The Alloy controller builds the
// Titanium widgets ($); when the modal has a lib/controllers/<name> screen
// controller it is handed those widgets plus a `close` callback, keeping all the
// non-Titanium wiring out of here. Modals without a lib controller just overlay.
View.prototype.openModal = function (name, args, services) {
  if (currentModal) this.closeModal();
  debug(`opening modal="${name}"`);
  const alloyCtl = Alloy.createController(name, args);
  const host = currentController;
  host.getView().add(alloyCtl.getView());

  const make = modalControllers[name];
  const close = () => this.closeModal();
  currentModal = {
    alloyCtl,
    host,
    lib: make ? make({ view: alloyCtl, close, services, palette: Alloy.CFG.colors }) : null,
  };
};

View.prototype.closeModal = function () {
  if (!currentModal) return;
  const { alloyCtl, host, lib } = currentModal;
  currentModal = null;
  host.getView().remove(alloyCtl.getView());
  if (lib) lib.dispose();
  if (typeof alloyCtl.cleanUp === "function") alloyCtl.cleanUp();
  else { alloyCtl.destroy(); alloyCtl.off(); }
};

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