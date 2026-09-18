require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { closeWindow, wrapViewInWindow, windowOpenTest, waitFor } = require('spec/util/TestUtils');
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var { makeBinder } = require("util/bindView");
var createTaxonComparison = require("mvvm/controllers/TaxonComparison");
var TaxonComparisonViewModel = require("mvvm/viewmodels/TaxonComparison");

var Taxon = require('logic/Taxon');
var Topics = require('ui/Topics');

// The screen asks a key for nothing but findTaxonById, so two taxa are the whole
// fixture — the same shape the visual manifest uses.
function comparisonKey(chosenName) {
	var taxa = {
		WBcorrect: Taxon.createTaxon({
			id: "WBcorrect",
			name: "Sleeping bag caddis",
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
	return "Waterbugidae".repeat(8).slice(0, length);
}

// The sentence the screen would show for that name, without opening the screen
// to find out.
function verdictFor(chosenName) {
	return new TaxonComparisonViewModel({
		key: comparisonKey(chosenName),
		topics: Topics,
		selectedTaxonId: "WBchosen",
		correctTaxonId: "WBcorrect"
	}).message;
}

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

	function openIncorrect(chosenName) {
		return open({ key: comparisonKey(chosenName), selectedTaxonId: "WBchosen", correctTaxonId: "WBcorrect" });
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

	// The shortest name whose verdict needs one more line than a one-letter name
	// does. Binary search is sound because a longer name never needs fewer lines.
	async function shortestNameNeedingAnExtraLine(font, width) {
		var shortestVerdict = await heightNeededFor( verdictFor( nameOfLength(1) ), font, width );
		var lo = 1, hi = 80;
		while ( lo < hi ) {
			var mid = Math.floor( (lo + hi) / 2 );
			var height = await heightNeededFor( verdictFor( nameOfLength(mid) ), font, width );
			if ( height > shortestVerdict ) { hi = mid; } else { lo = mid + 1; }
		}
		return nameOfLength( lo );
	}

	function laidOut() {
		return waitFor(function() {
			return mod.verdictIcon.rect.height > 0 && mod.comparisonMessage.rect.height > 0;
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

	// The names that clip are the ones needing one more line in the room the icon
	// leaves than in the whole row, and which names those are depends on the
	// device's width and the font — so the fixture is measured here, not guessed.
	it('shows the whole verdict sentence however long the name is', async () => {
		await openIncorrect();
		await laidOut();
		var font = mod.comparisonMessage.font;
		var lineWidth = mod.comparisonMessage.rect.width, rowWidth = mod.verdictRow.rect.width;
		var name = await shortestNameNeedingAnExtraLine( font, lineWidth );
		if ( await heightNeededFor( verdictFor(name), font, rowWidth )
			>= await heightNeededFor( verdictFor(name), font, lineWidth ) ) {
			throw new Error(`no name wraps differently across the ${rowWidth}px row and the ${lineWidth}px line it leaves`);
		}
		await closeCurrent();

		await openIncorrect( name );
		await laidOut();
		expect( mod.comparisonMessage.rect.height, "message height" ).to.be.at.least(
			await heightNeededFor( mod.comparisonMessage.text, font, mod.comparisonMessage.rect.width ) );
	});

	// The icon belongs beside the sentence, not above it — on the narrower phone
	// for both verdicts, on the wider one only for the longer "incorrect" one.
	[
		{ name: "correct", openIt: openCorrect },
		{ name: "incorrect", openIt: openIncorrect },
	].forEach(function(verdict) {
		it(`keeps the ${verdict.name} verdict icon on the same row as its message`, async () => {
			await verdict.openIt();
			await laidOut();
			var icon = mod.verdictIcon.rect, message = mod.comparisonMessage.rect;
			expect( message.x, "message starts right of the icon" ).to.be.at.least( icon.x + icon.width );
		});
	});
});
