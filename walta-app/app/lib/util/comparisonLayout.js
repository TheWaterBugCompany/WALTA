// How big the taxon comparison screen's photos can be on the screen it is
// actually running on. Titanium-free and unit-free: every number here is in the
// app's system unit, which is what screenMetrics already reports.
//
// The screen used to size its cards in fixed dp per resolution bucket, but the
// bucket is chosen by height and spans 300-700 of it, so a 640-wide phone and a
// 914-wide one were handed the same card. Sized for the narrow one it wasted
// half the wide one; sized for the wide one the second photo ran off the narrow
// one. Measuring the real screen is what lets both have the largest photo that
// fits.

// The chrome the photos share the modal with. These mirror TaxonComparison.tss,
// which reads the results back out of Alloy.Globals — so the numbers live here
// and the stylesheet holds none of its own.
// heading is the height the verdict line renders at, measured on device rather
// than derived from the font size — it is what decides how much of the
// titlebar's height is slack around the text.
var CHROME = {
	base:   { gap: 14, titlebar: 30, heading: 20, action: 36, icon: 32, iconGap: 8, entryMargin: 6, sidePadding: 30 },
	high:   { gap: 20, titlebar: 54, heading: 28, action: 48, icon: 44, iconGap: 8, entryMargin: 6, sidePadding: 46 },
	xhigh:  { gap: 28, titlebar: 30, heading: 40, action: 64, icon: 64, iconGap: 8, entryMargin: 6, sidePadding: 54 },
};

// The photographs are 4:3 and a card is cropped to the photo, so the box has to
// keep that shape or the creature comes out stretched.
var ASPECT = 4 / 3;

// Leave the modal clear of the screen edge rather than letting it bleed to it —
// it reads as a dialog over the tray, not as a new screen.
var SCREEN_MARGIN = 12;

function chromeFor(screen) {
	if (screen.isXHighRes) { return CHROME.xhigh; }
	if (screen.isHighRes) { return CHROME.high; }
	return CHROME.base;
}

// The titlebar is as tall as the close button while the heading centres itself
// in it, so there is white space either side of the text that already counts
// towards the gap. That slack is what the two margins above the photos give
// back, so all four gaps read the same.
function headingSlack(c) {
	return Math.max(0, (c.titlebar - c.heading) / 2);
}

function aboveGap(c) {
	return Math.max(0, c.gap - headingSlack(c));
}

// Four even gaps down the modal — above the heading, below it, below the photos
// and below the action — plus the titlebar and the action themselves.
function chromeHeight(c) {
	return 2 * aboveGap(c) + c.titlebar + 2 * c.gap + c.action;
}

// Everything across the modal that is not the two cards: the marks, the margins
// between entries, and the padding at both ends.
function chromeWidth(c) {
	return 2 * (2 * c.entryMargin + c.icon + c.iconGap) + 2 * c.sidePadding;
}

module.exports = function comparisonLayout(screen) {
	var c = chromeFor(screen);

	// Two cards abreast have to fit the width; one card's height has to fit what
	// the chrome leaves of the height. Whichever budget runs out first sets the
	// size, so the card is the smaller of the two and the other keeps its slack.
	var widthBudget = (screen.relWidth - SCREEN_MARGIN * 2 - chromeWidth(c)) / 2;
	var heightBudget = screen.relHeight - SCREEN_MARGIN * 2 - chromeHeight(c);

	var cardWidth = Math.floor(Math.min(widthBudget, heightBudget * ASPECT));
	var cardHeight = Math.round(cardWidth / ASPECT);

	var sizes = {
		cardWidth: cardWidth,
		cardHeight: cardHeight,
		verdictWidth: c.icon + c.iconGap,
		iconSize: c.icon,
		gap: c.gap,
		aboveGap: aboveGap(c),
		iconGap: c.iconGap,
		entryMargin: c.entryMargin,
		actionHeight: c.action,
		modalWidth: 2 * (2 * c.entryMargin + c.icon + c.iconGap + cardWidth) + 2 * c.sidePadding,
		modalHeight: chromeHeight(c) + cardHeight,
	};

	// The stylesheet reads these rather than the bare numbers. A number on its own
	// is taken in the system unit, which on Android is the pixel — so an unsuffixed
	// 198 laid out a card a third of the size asked for. The same "…Css" suffix the
	// tray cells use for the same reason.
	sizes.css = {};
	Object.keys(sizes).forEach(function (key) { sizes.css[key] = sizes[key] + "dp"; });

	return sizes;
};
