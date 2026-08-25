var Topics = require('ui/Topics');

// Residual Titanium shell for the training ice-cube tray. The Titanium-free
// lib/mvvm/controllers/TrainingTray (built by View.openView) owns the view-model
// and declares the whole screen through bindView.
// See docs/patterns/screen-controllers.md.

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "trainingtray";
$.TopLevelWindow.useUnSafeArea = true;
$.noSwipeBack();

$.content = $.iceCubeTray.content;
$.tray = $.iceCubeTray.tray;

var acb = $.getAnchorBar();
// Training has no survey stack behind it — Back returns to the menu (from where the
// user re-enters the Academy) rather than the survey's Habitat.
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HOME, slide: "left" });
acb.addTool($.backButton.getView());
// Training grades the tray instead of moving on to Notes.
$.assessButton = Alloy.createController("AssessButton", {});
acb.addTool($.assessButton.getView());

// The base controller only adds $.content + the anchor bar to the window, so the
// notice overlay (a second top-level view) has to be attached to the window here.
// This is the only shell concern; its visibility/text/fade are all bindView-driven
// off the view-model.
$.TopLevelWindow.add($.incorrectNotice);
