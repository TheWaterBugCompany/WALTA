var Topics = require('ui/Topics');

// Residual Titanium shell for the ice-cube tray. The Titanium-free
// lib/mvvm/controllers/SampleTray (built by View.openView) owns the view-model and
// declares the whole screen through bindView — the tray collections and the
// viewport measurement / scroll offset / scroll-to-right inputs. What is left here
// is the view tree, the anchor-bar buttons (the nav seam is a later concern), and
// the EditTaxon overlay (its own port). See docs/patterns/screen-controllers.md.

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "sampletray";
$.TopLevelWindow.useUnSafeArea = true;
$.noSwipeBack();

var readOnlyMode = $.args.readonly === true;

var acb = $.getAnchorBar();
// Training has no survey stack behind it — Back returns to the menu (from where the
// user re-enters the Academy) rather than the survey's Habitat.
var backTopic = $.args.training ? Topics.HOME : Topics.HABITAT;
$.backButton = Alloy.createController("GoBackButton", { topic: backTopic, slide: "left", readonly: readOnlyMode });
acb.addTool($.backButton.getView());
// Training grades the tray instead of moving on to Notes.
if ( $.args.training ) {
  $.assessButton = Alloy.createController("AssessButton", {});
  acb.addTool($.assessButton.getView());
} else {
  $.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.NOTES, slide: "right", readonly: readOnlyMode });
  acb.addTool($.nextButton.getView());
}

// The base controller only adds $.content + the anchor bar to the window, so the
// notice overlay (a second top-level view) has to be attached to the window here.
// This is the only shell concern; its visibility/text/fade are all bindView-driven
// off the view-model.
$.TopLevelWindow.add($.incorrectNotice);

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
