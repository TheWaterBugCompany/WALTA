var Topics = require('ui/Topics');

// Residual Titanium shell for the survey ice-cube tray. The Titanium-free
// lib/mvvm/controllers/SampleTray (built by View.openView) owns the view-model and
// declares the whole screen through bindView — the tray collections and the
// viewport measurement / scroll offset / scroll-to-right inputs. What is left here
// is the view tree, the anchor-bar buttons, and the EditTaxon overlay (its own
// port). Training's peer screen is TrainingTray.js — a separate screen, not a
// branch of this one. See docs/patterns/screen-controllers.md.

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "sampletray";
$.TopLevelWindow.useUnSafeArea = true;
$.noSwipeBack();

$.content = $.iceCubeTray.content;
$.tray = $.iceCubeTray.tray;

var readOnlyMode = $.args.readonly === true;

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HABITAT, slide: "left", readonly: readOnlyMode });
acb.addTool($.backButton.getView());
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.NOTES, slide: "right", readonly: readOnlyMode });
acb.addTool($.nextButton.getView());

function closeEditScreen() {
  if (typeof $.editTaxon === "object") {
    $.getView().remove($.editTaxon.getView());
    $.editTaxon.cleanUp();
    delete $.editTaxon;
  }
}

function editTaxon() {
  $.editTaxon = Alloy.createController("EditTaxon", $.args);
  $.getView().add($.editTaxon.getView());
  $.editTaxon.on("close", function () {
    // closes but leaves temporary state untouched
    closeEditScreen();
  });
  $.editTaxon.on("save", function () {
    $.trigger("taxonSaved");
  });
}

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  closeEditScreen();
  $.TopLevelWindow.removeEventListener('close', cleanUp);
});

if (!_.isUndefined($.args.taxonId) || !_.isUndefined($.args.sampleTaxonId)) {
  $.TopLevelWindow.addEventListener("open", editTaxon);
  $.TopLevelWindow.addEventListener("close", function closeWindow() {
    $.TopLevelWindow.removeEventListener("open", editTaxon);
    $.TopLevelWindow.removeEventListener("close", closeWindow);
  });
}

exports.editTaxon = editTaxon;
