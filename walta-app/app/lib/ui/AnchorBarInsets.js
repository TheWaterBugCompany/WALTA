// Android reserves the bottom edge for the home gesture and takes those touches
// before the app sees them, so a control drawn there is simply dead. The reserved
// strip is larger than the safe area: safeAreaPadding covers the system bars
// (24dp of navigation bar under gesture navigation), while the gesture strip is
// 32dp. Three-button navigation has no bottom strip at all — in landscape the bar
// moves to the right edge — and then there is nothing to clear.
// See docs/patterns/anchor-bar-insets.md.
var GESTURE_STRIP_DP = 32;

function bottomClearance(safeAreaPadding, dpToSystem) {
	var inset = safeAreaPadding.bottom || 0;
	if ( inset === 0 ) return 0;
	return Math.max(inset, dpToSystem(GESTURE_STRIP_DP));
}

exports.bottomClearance = bottomClearance;
