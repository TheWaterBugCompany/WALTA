
var Topics = require('ui/Topics');
const Logger = require("util/Logger");
const { makeBinder } = require("util/bindView");
const defaultScreenControllers = require("mvvm/controllers/registry");

var debug = (m, tag = "ui") => Logger.log(m, tag);
let currentController = null;
let currentScreenController = null;
let saveOrDiscard = null;
let currentModal = null;

function DialogCancelled() {
}

function View(services) {
  this.services = services;
  // The screen-controller registry (name → mvvm/controllers/<name> factory) is
  // injectable so the seam is testable with a fake controller; defaults to the
  // real registry.
  this.screenControllers = (services && services.screenControllers) || defaultScreenControllers;
}

// The context every screen/row/modal controller is built with. Hands it a
// bindView pre-bound with the View-side dependencies (createComponent, palette,
// the image measurer fit() sizes from) so the controller declares only its
// bindings and never wires a Titanium dependency itself — mvvm/controllers stays
// a pure DSL layer.
View.prototype.controllerContext = function (alloyCtl, close, args, services) {
  return {
    view: alloyCtl,
    close,
    services,
    args,
    bindView: makeBinder((name, a) => this.createComponent(name, a), Alloy.CFG.colors, this.services.photoSize),
  };
};

View.prototype.getSaveOrDiscard = function() { return saveOrDiscard; }
View.prototype.getCurrentController = function() { return currentController; }
// The current window's Titanium-free screen controller (with its view-model) —
// the seam a device spec reaches through for view-model state now that the Alloy
// shell holds none.
View.prototype.getScreenController = function() { return currentScreenController; }
View.prototype.getCurrentModal = function() { return currentModal; }

View.prototype.openView = function(ctl,args) {
  return new Promise( (resolve) => {
    debug(`opening controller="${ctl}" with args.readonly= ${args.readonly}`);
    // Navigating to a new window dismisses any open modal (its host window is
    // about to be replaced).
    if (currentModal) this.closeModal();
    currentController = Alloy.createController(ctl,args);
    this.attachScreenController(ctl, currentController, args);
    currentController.on("window-opened", resolve);
    currentController.open();
  });
}

// A window gets the same Titanium-free screen controller as a modal: if one is
// registered, instantiate it with the window's widgets to drive the binding,
// and dispose it when the window closes (windows have no closeView — the
// TopLevelWindow 'close' event is the teardown hook).
View.prototype.attachScreenController = function(name, alloyCtl, args) {
  const make = this.screenControllers[name];
  if (!make) return;
  const win = alloyCtl.getView();
  const close = () => win.close();
  const lib = make(this.controllerContext(alloyCtl, close, args, this.services));
  currentScreenController = lib;
  function onClose() {
    win.removeEventListener("close", onClose);
    currentScreenController = null;
    lib.dispose();
  }
  win.addEventListener("close", onClose);
}

// Build a reusable child component (e.g. a list row): its Alloy controller plus,
// if one is registered, its Titanium-free lib/mvvm/controllers/<name>. Returns a
// handle the caller adds to a container and disposes. This is the seam a
// collection binding's `create` goes through, so it never calls Alloy directly.
View.prototype.createComponent = function (name, args) {
  const alloyCtl = Alloy.createController(name, args);
  const make = this.screenControllers[name];
  const lib = make
    ? make(this.controllerContext(alloyCtl, () => {}, args, this.services))
    : null;
  return {
    view: alloyCtl.getView(),
    lib,
    dispose() {
      if (lib && typeof lib.dispose === "function") lib.dispose();
      if (typeof alloyCtl.cleanUp === "function") alloyCtl.cleanUp();
      else { alloyCtl.destroy(); alloyCtl.off(); }
    },
  };
};

// Overlay a modal on the current window, handing its widgets to an optional
// lib/mvvm/controllers/<name> screen controller. See docs/patterns/modals.md.
View.prototype.openModal = function (name, args, services) {
  if (currentModal) this.closeModal();
  debug(`opening modal="${name}"`);
  const alloyCtl = Alloy.createController(name, args);
  const host = currentController;
  host.getView().add(alloyCtl.getView());

  const make = this.screenControllers[name];
  const close = () => this.closeModal();
  currentModal = {
    alloyCtl,
    host,
    lib: make ? make(this.controllerContext(alloyCtl, close, args, services)) : null,
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

View.prototype.askDiscardEdits = function ( sample ) {
  var me = this;
  return new Promise(function (resolve, reject) {
    var message;
    var buttons;
    var cancel;
    var discard;
    var submit;

    if ( me.services.Survey.isNewSurvey( sample ) ) {
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