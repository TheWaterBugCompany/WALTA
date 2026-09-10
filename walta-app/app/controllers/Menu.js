// Presenter shell only — the Titanium-free lib/mvvm/controllers/Menu screen
// controller (built by View.openView) holds all behaviour. This keeps only what
// Alloy needs: the base window and the navigation identity.
// See docs/patterns/screen-controllers.md.
exports.baseController = "TopLevelWindow";
$.name = "home";

// Matches "#smallOptions" bottom in Menu.tss: the row deliberately overhangs.
var SMALL_OPTIONS_OVERHANG = -8;

// This screen takes the whole window, notch strip included, so the belt can run
// to the physical corner — it is decoration, and decoration may sit under the
// cutout. The controls may not, so the inset the window would have applied to
// $.content is applied to the two groups that hold them instead.
$.TopLevelWindow.useUnSafeArea = true;
$.TopLevelWindow.addEventListener("postlayout", function () {
	var padding = $.TopLevelWindow.safeAreaPadding;
	if (!padding) return;
	// Only the horizontal inset, and only on the group that holds the controls
	// sitting against the edges (the version label and the login button).
	$.bigOptions.applyProperties({ left: padding.left, right: padding.right });
	// The button row is centred and narrower than the safe width, so it needs
	// the bottom inset only — kept relative to the overhang the style asks for.
	$.smallOptions.bottom = padding.bottom + SMALL_OPTIONS_OVERHANG;
});
