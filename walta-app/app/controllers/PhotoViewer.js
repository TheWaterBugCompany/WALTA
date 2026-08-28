// Residual Titanium shell for the photo viewer. The Titanium-free
// lib/mvvm/controllers/PhotoViewer (built by View.openView) owns the view-model
// and declares the whole screen through bindView.
// See docs/patterns/screen-controllers.md.

exports.baseController = "TopLevelWindow";
$.name = "photoviewer";
$.TopLevelWindow.useUnSafeArea = true;
