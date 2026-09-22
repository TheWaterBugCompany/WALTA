// Presenter shell only — the Titanium-free lib/mvvm/controllers/Account screen
// controller (built by View.openView) owns the view-model and every binding.
// All that lives here is the window's own title.
// See docs/patterns/screen-controllers.md.
exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Account Details";
