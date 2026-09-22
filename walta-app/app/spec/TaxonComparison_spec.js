require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { closeWindow, wrapViewInWindow, windowOpenTest, waitFor } = require('spec/util/TestUtils');
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var { makeBinder } = require("util/bindView");
var createTaxonComparison = require("mvvm/controllers/TaxonComparison");

var Taxon = require('logic/Taxon');
var Topics = require('ui/Topics');

// The screen asks a key for nothing but findTaxonById, so two taxa are the whole
// fixture — the same shape the visual manifest uses.
function comparisonKey(chosenName, correctName) {
	var taxa = {
		WBcorrect: Taxon.createTaxon({
			id: "WBcorrect",
			name: correctName || "Sleeping bag caddis",
			mediaUrls: ["/spec/resources/simpleKey1/media/parastacide_01.jpg"]
		}),
		WBchosen: Taxon.createTaxon({
			id: "WBchosen",
			name: chosenName || "Anisops",
			mediaUrls: ["/spec/resources/simpleKey1/media/amphipoda_01.jpg"]
		})
	};
	return { findTaxonById: function (id) { return taxa[id]; } };
}

// One word rather than several, so the length at which a name stops fitting a
// line is a length in characters rather than a jump of a whole word.
function nameOfLength(length) {
	return "Waterbugidae".repeat(16).slice(0, length);
}

// The two longest names the key carries — a taxon can be named for a whole group
// of families, and each caption has to carry one of them over its photo.
var LONGEST_CHOSEN = "Tabanidae, Dolichopodidae, Empididae & some Tipulidae";
var LONGEST_CORRECT = "Some Oecetis sp. (Leptoceridae) and Odontoceridae";

// Drives the real modal — Alloy presenter plus the Titanium-free screen
// controller through bindView — so the on-device layout is exercised. The
// verdict/message logic itself is covered in Node
// (test/viewmodels/TaxonComparison_spec.js).
describe('TaxonComparison modal', function() {
	var host, mod, win, ctl;

	function open(args) {
		return new Promise(function(resolve) {
			host = new View(makeTestServices());
			mod = Alloy.createController("TaxonComparison", args);
			win = wrapViewInWindow( mod.getView() );
			ctl = createTaxonComparison({
				view: mod,
				close: function() {},
				services: { topics: Topics },
				bindView: makeBinder(function(name, a) { return host.createComponent(name, a); }, Alloy.CFG.colors),
				args: args
			});
			windowOpenTest( win, resolve );
		});
	}

	function openCorrect() {
		return open({ key: comparisonKey(), selectedTaxonId: "WBcorrect", correctTaxonId: "WBcorrect" });
	}

	function openIncorrect(chosenName, correctName) {
		return open({ key: comparisonKey(chosenName, correctName), selectedTaxonId: "WBchosen", correctTaxonId: "WBcorrect" });
	}

	// Landscape, so the short edge is the height and the long edge the width,
	// whichever way the platform reports the screen.
	function viewportHeight() { return viewportEdge( Math.min ); }
	function viewportWidth() { return viewportEdge( Math.max ); }

	// displayCaps reports points on iOS and pixels on Android, and rect reports the
	// same unit on each, so the two compare directly — scaling by the density
	// factor made the screen three times bigger than it is.
	function viewportEdge( pick ) {
		var caps = Ti.Platform.displayCaps;
		return pick( caps.platformWidth, caps.platformHeight );
	}

	async function closeCurrent() {
		await closeWindow( win );
		ctl.dispose();
	}

	// What a run of text needs when nothing constrains it but the width it is
	// given — so the height a label of that width has to have to show all of it.
	async function heightNeededFor(text, font, width) {
		var probe = Ti.UI.createLabel({
			text: text, font: font, width: width, height: Ti.UI.SIZE, top: 0, left: 0, opacity: 0
		});
		win.add( probe );
		await waitFor(function() { return probe.rect.height > 0; });
		var height = probe.rect.height;
		win.remove( probe );
		return height;
	}

	// The shortest name needing one more line than a one-letter name does, at the
	// width given. Binary search is sound because a longer name never needs fewer
	// lines.
	async function shortestNameNeedingAnExtraLine(font, width) {
		var oneLine = await heightNeededFor( nameOfLength(1), font, width );
		var lo = 1, hi = 160;
		while ( lo < hi ) {
			var mid = Math.floor( (lo + hi) / 2 );
			if ( await heightNeededFor( nameOfLength(mid), font, width ) > oneLine ) { hi = mid; }
			else { lo = mid + 1; }
		}
		if ( await heightNeededFor( nameOfLength(lo), font, width ) <= oneLine ) {
			throw new Error(`no name up to ${hi} characters wraps at ${width}px`);
		}
		return nameOfLength( lo );
	}

	// An entry's children are [ verdict box, card ]; the mark is the box's only
	// child, and the card's are [ photo, caption ].
	function entries() { return mod.photos.children; }
	function verdictBoxOf(entry) { return entry.children[0]; }
	function markOf(entry) { return verdictBoxOf(entry).children[0]; }
	function cardOf(entry) { return entry.children[1]; }
	function captionOf(entry) { return cardOf(entry).children[1]; }

	function laidOut() {
		return waitFor(function() {
			return mod.comparisonMessage.rect.height > 0
				&& entries().length > 0 && cardOf( entries()[0] ).rect.width > 0;
		});
	}

	afterEach( async function() {
		await closeWindow( win );
		if ( ctl ) ctl.dispose();
	});

	// A Titanium Button sizes to its title and ignores padding on iOS, so the
	// border was drawn hard against the glyphs. Chrome and text are separate views
	// now, and the gap between them is the thing worth pinning.
	[
		{ name: "Close", openIt: openCorrect },
		{ name: "follow-up", openIt: openIncorrect },
	].forEach(function(variant) {
		it(`holds the ${variant.name} action's border clear of its title`, async () => {
			await variant.openIt();
			await waitFor(function() { return mod.actionText.rect.width > 0; });
			var chrome = mod.action.rect, text = mod.actionText.rect;
			expect( chrome.width - text.width, "horizontal padding" ).to.be.at.least( 16 );
		});
	});

	// The caption is the only place the screen says which taxon is which, so a name
	// that clips is the screen failing at its job. Android measures a
	// margin-anchored label at a width it is not laid out in, and which names that
	// bites depends on the device's width and the font — so the fixture is
	// measured here, not guessed.
	it('shows the whole taxon name however long it is', async () => {
		await openIncorrect();
		await laidOut();
		var caption = captionOf( entries()[0] );
		var font = caption.font;
		var name = await shortestNameNeedingAnExtraLine( font, caption.rect.width );
		await closeCurrent();

		await openIncorrect( name );
		await laidOut();
		var wrapped = captionOf( entries()[0] );
		expect( wrapped.rect.height, "caption height" ).to.be.at.least(
			await heightNeededFor( wrapped.text, font, wrapped.rect.width ) );
	});

	// Long names wrap inside their own card now rather than growing a sentence
	// above the photos, so nothing below them should move. Worth keeping pinned:
	// when the modal did outgrow a short landscape screen, Titanium handed the
	// action a negative height rather than shrink anything above it, so the button
	// was simply not there.
	it('keeps the action on screen under the longest names in the key', async () => {
		await openIncorrect( LONGEST_CHOSEN, LONGEST_CORRECT );
		await laidOut();
		expect( mod.action.rect.height, "action height" ).to.be.greaterThan( 0 );
		expect( mod.comparisonWindow.rect.height, "modal height" ).to.be.at.most( viewportHeight() );
	});

	// The two photos are side by side so they can be compared, which only works if
	// both are actually on screen. The cards are sized in dp per resolution bucket
	// while the modal was a percentage of the screen, and the bucket says nothing
	// about how wide the screen is — so on a narrow phone in the same bucket as a
	// wide one, the second photo ran off the edge of the modal.
	it('fits both photos inside a modal that fits the screen', async () => {
		await openIncorrect();
		await laidOut();
		var last = entries()[ entries().length - 1 ].rect;
		expect( last.x + last.width, "right edge of the last photo against the modal" )
			.to.be.at.most( mod.photos.rect.width );
		expect( mod.comparisonWindow.rect.width, "modal against the screen" )
			.to.be.at.most( viewportWidth() );
	});

	// The photos are sized from the screen actually in front of the reader, not
	// from the smallest screen in its resolution bucket — so whichever budget runs
	// out first should be nearly spent, rather than the modal sitting well inside
	// both. Measured on the rendered modal, so it also catches the stylesheet
	// failing to read the computed sizes at all.
	it('fills the screen it is on rather than the smallest in its bucket', async () => {
		await openIncorrect();
		await laidOut();
		var win = mod.comparisonWindow.rect;
		var card = cardOf( entries()[0] ).rect;
		var spare = Math.min( viewportWidth() - win.width, viewportHeight() - win.height );
		expect( spare, "slack left in the tighter of the two budgets" ).to.be.below( card.width / 2 );
	});

	// The mark judges a photo, so it reads as the photo's own rather than the
	// screen's only when it sits beside it. Two photos each carry their own, which
	// is what tells the reader which of the pair was chosen.
	[
		{ name: "correct", openIt: openCorrect },
		{ name: "incorrect", openIt: openIncorrect },
	].forEach(function(verdict) {
		it(`keeps each ${verdict.name} mark beside the photo it judges`, async () => {
			await verdict.openIt();
			await laidOut();
			entries().forEach(function(entry, i) {
				var box = verdictBoxOf( entry ).rect, mark = markOf( entry ).rect, card = cardOf( entry ).rect;
				expect( mark.width, `mark ${i} is drawn` ).to.be.greaterThan( 0 );
				expect( box.x + mark.x + mark.width, `mark ${i} ends left of its photo` ).to.be.at.most( card.x );
			});
		});
	});
});
