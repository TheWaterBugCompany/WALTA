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
function comparisonKey() {
	var taxa = {
		WBcorrect: Taxon.createTaxon({
			id: "WBcorrect",
			name: "Sleeping bag caddis",
			mediaUrls: ["/spec/resources/simpleKey1/media/parastacide_01.jpg"]
		}),
		WBchosen: Taxon.createTaxon({
			id: "WBchosen",
			name: "Anisops",
			mediaUrls: ["/spec/resources/simpleKey1/media/amphipoda_01.jpg"]
		})
	};
	return { findTaxonById: function (id) { return taxa[id]; } };
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

	function openIncorrect() {
		return open({ key: comparisonKey(), selectedTaxonId: "WBchosen", correctTaxonId: "WBcorrect" });
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

	// The icon belongs beside the sentence, not above it. A FILL-width label in a
	// horizontal row claims the whole row, so the icon wrapped onto a line of its
	// own — on the narrower phone for both verdicts, on the wider one only for the
	// longer "incorrect" sentence.
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
