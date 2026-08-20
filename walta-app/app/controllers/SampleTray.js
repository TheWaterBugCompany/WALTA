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
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HABITAT, slide: "left", readonly: readOnlyMode });
acb.addTool($.backButton.getView());
// Training grades the tray instead of moving on to Notes.
if ( $.args.training ) {
  $.assessButton = Alloy.createController("AssessButton", {});
  acb.addTool($.assessButton.getView());
} else {
  $.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.NOTES, slide: "right", readonly: readOnlyMode });
  acb.addTool($.nextButton.getView());
}

// The assessment notice: fade in, dwell, fade out. Dwell is overridable via args
// so a spec can poll the auto-hide without a real 4-second wait. visible is driven
// off timers, not the animate() completion callback — that callback is unreliable
// for opacity on iOS, so the notice would fade to transparent but never hide.
var NOTICE_DWELL_MS = $.args.noticeDwellMs || 4000;
var NOTICE_FADE_MS = 400;
$.incorrectNoticeLabel.text = "One or more of the expected taxa are incorrect.\nPlease select incorrect identifications below for details.";
var noticeTimers = [];

function clearNoticeTimers() {
  noticeTimers.forEach(clearTimeout);
  noticeTimers = [];
}

function showIncorrectNotice() {
  clearNoticeTimers();
  $.incorrectNotice.opacity = 0;
  $.incorrectNotice.visible = true;
  $.incorrectNotice.animate({ opacity: 1, duration: 200 });
  noticeTimers.push(setTimeout(function () {
    $.incorrectNotice.animate({ opacity: 0, duration: NOTICE_FADE_MS });
    noticeTimers.push(setTimeout(function () { $.incorrectNotice.visible = false; }, NOTICE_FADE_MS));
  }, NOTICE_DWELL_MS));
}
exports.showIncorrectNotice = showIncorrectNotice;
// The base controller only adds $.content + the anchor bar to the window, so the
// notice (a second top-level view) has to be added as a window overlay itself.
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
  clearNoticeTimers();
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
