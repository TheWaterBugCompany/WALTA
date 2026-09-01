// Android reserves the bottom edge for the home gesture and takes those touches
// before the app sees them, so a control drawn there is simply dead. The reserved
// strip is larger than the safe area: safeAreaPadding covers the system bars
// (24dp of navigation bar), while the gesture strip is 32dp.
// See docs/patterns/anchor-bar-insets.md.
var GESTURE_STRIP_DP = 32;

function bottomClearance(safeAreaPadding, dpToSystem) {
	return Math.max(safeAreaPadding.bottom || 0, dpToSystem(GESTURE_STRIP_DP));
}

exports.bottomClearance = bottomClearance;
