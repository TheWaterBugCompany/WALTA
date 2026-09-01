// Titanium force-rotates a window to a fixed fallback until the device reports
// an orientation, so a window opened during a cold launch can come up a half
// turn out. See docs/patterns/window-orientation.md.
function holdCurrentOrientation(win, gesture) {
	var declared = win.orientationModes;
	win.orientationModes = [ win.orientation ];

	function giveBackDeclared() {
		gesture.removeEventListener("orientationchange", giveBackDeclared);
		win.orientationModes = declared;
	}
	gesture.addEventListener("orientationchange", giveBackDeclared);
}

exports.holdCurrentOrientation = holdCurrentOrientation;
