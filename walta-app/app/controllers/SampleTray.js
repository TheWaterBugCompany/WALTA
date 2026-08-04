var Topics = require('ui/Topics');

// Residual Titanium shell for the ice-cube tray. The Titanium-free
// lib/mvvm/controllers/SampleTray (built by View.openView) owns the view-model and
// declares the whole screen through bindView — the tray collections and the scroll
// offset / viewport measurement / scroll-to-right inputs. All that is left here is
// the view tree, the anchor-bar buttons (the nav seam is a later concern), and the
// EditTaxon overlay (its own port). See docs/patterns/screen-controllers.md.

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "sampletray";
$.TopLevelWindow.useUnSafeArea = true;
$.noSwipeBack();

var readOnlyMode = $.args.readonly === true;

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HABITAT, slide: "left", readonly: readOnlyMode });
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.NOTES, slide: "right", readonly: readOnlyMode });
acb.addTool($.backButton.getView());
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
