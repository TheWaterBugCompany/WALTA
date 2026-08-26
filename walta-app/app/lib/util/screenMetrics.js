// Android reports displayCaps in raw pixels; iOS reports points, which are
// already density-independent. Dividing both by the density factor put every
// iPhone in the smallest bucket.
function densityUnitsPerPoint(displayCaps, osname) {
	return osname === "android" ? displayCaps.logicalDensityFactor : 1;
}

// The app runs landscape, but the platform may report portrait-oriented
// dimensions, so the long edge is always the width.
function landscape(width, height) {
	return height > width ? { relWidth: height, relHeight: width } : { relWidth: width, relHeight: height };
}

var LOW_RES_MAX = 300;
var HIGH_RES_MAX = 700;
var SQUARE_MAX_ASPECT = 1.5;

function screenMetrics(displayCaps, osname) {
	var scale = densityUnitsPerPoint(displayCaps, osname);
	var size = landscape(displayCaps.platformWidth / scale, displayCaps.platformHeight / scale);
	var aspectRatio = size.relWidth / size.relHeight;
	return {
		relWidth: size.relWidth,
		relHeight: size.relHeight,
		aspectRatio: aspectRatio,
		isSquare: aspectRatio < SQUARE_MAX_ASPECT,
		isLowRes: size.relHeight < LOW_RES_MAX,
		isHighRes: size.relHeight >= LOW_RES_MAX && size.relHeight < HIGH_RES_MAX,
		isXHighRes: size.relHeight >= HIGH_RES_MAX,
	};
}

module.exports = screenMetrics;
