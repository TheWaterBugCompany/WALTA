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

// The bottom of the high-res band. Everything in that band is written in fixed
// dp, and the band runs to 700dp, so a screen down here cannot take the sizes a
// screen at the top of it can.
var SHORT_MAX = 380;
var HIGH_RES_MAX = 700;
var SQUARE_MAX_ASPECT = 1.5;

// The bands a landscape size in dp is in — every flag a stylesheet can ask about,
// and nothing else, so the set of bands can be read off this one function. The
// visual suite reads it to check each band it renders has a device in it.
function bands(size) {
	var aspectRatio = size.relWidth / size.relHeight;
	return {
		isSquare: aspectRatio < SQUARE_MAX_ASPECT,
		isHighRes: size.relHeight < HIGH_RES_MAX,
		isXHighRes: size.relHeight >= HIGH_RES_MAX,
		// Deliberately overlaps the buckets rather than splitting them: a short
		// screen is still isHighRes, so a style only overrides what it must.
		isShort: size.relHeight < SHORT_MAX,
	};
}

function screenMetrics(displayCaps, osname) {
	var scale = densityUnitsPerPoint(displayCaps, osname);
	var size = landscape(displayCaps.platformWidth / scale, displayCaps.platformHeight / scale);
	var metrics = {
		relWidth: size.relWidth,
		relHeight: size.relHeight,
		aspectRatio: size.relWidth / size.relHeight,
	};
	var inBand = bands(size);
	Object.keys(inBand).forEach(function (band) { metrics[band] = inBand[band]; });
	return metrics;
}

// Every band name, so a caller can ask which bands exist without inventing a
// screen to classify. Derived from bands() rather than listed, so a band added
// there is a band everything asking this question already knows about.
var BANDS = Object.keys(bands({ relWidth: 2, relHeight: 1 }));

module.exports = screenMetrics;
module.exports.bands = bands;
module.exports.BANDS = BANDS;
