require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, waitFor } = require("spec/util/TestUtils");
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");

// A titled screen is split between its content and the anchor bar, and the two
// are meant to account for the whole window. On a square screen they did not:
// the content started a tenth of the way down and the pair came to 95% of the
// height, which is the dead band above the tray and below it.
//
// The band is forced on rather than waited for, because the iPad is the only
// device in it — left to the running device this would pass everywhere by
// never running the layout it is about.
describe("TopLevelWindow layout", function () {
	var view, ctl, wasSquare;

	function geometry() {
		return {
			window: ctl.getView().rect,
			content: ctl.content.rect,
			bar: ctl.getAnchorBar().getView().rect,
		};
	}

	function openSquare(square) {
		wasSquare = Alloy.Globals.isSquare;
		Alloy.Globals.isSquare = square;
		view = new View(makeTestServices());
		return view.openView("About", {}).then(async function () {
			ctl = view.getCurrentController();
			await waitFor(function () {
				var g = geometry();
				return g.window.height > 0 && g.content.height > 0 && g.bar.height > 0;
			});
		});
	}

	afterEach(async function () {
		Alloy.Globals.isSquare = wasSquare;
		if (ctl) { await closeWindow(ctl.getView()); }
		ctl = null;
	});

	describe("on a square screen", function () {
		beforeEach(function () { return openSquare(true); });

		it("starts the content at the top of the window", function () {
			expect(geometry().content.y).to.equal(0);
		});

		it("gives the whole window to the content and the anchor bar", function () {
			var g = geometry();
			// Within a point: the two are percentages of the window and round
			// independently, so 90% + 10% of 402 lands on 401.
			expect(g.content.height + g.bar.height).to.be.closeTo(g.window.height, 1);
		});
	});

	// A screen with no title has no anchor bar, so its content owns the window
	// outright. On a square screen the Menu stylesheet inset it a tenth anyway,
	// which is the blank band above the menu and the clipped corner ribbon.
	describe("a screen with no anchor bar, on a square screen", function () {
		beforeEach(async function () {
			wasSquare = Alloy.Globals.isSquare;
			Alloy.Globals.isSquare = true;
			view = new View(makeTestServices());
			await view.openView("Menu", { unknown_bug: true });
			ctl = view.getCurrentController();
			await waitFor(function () {
				return ctl.getView().rect.height > 0 && ctl.content.rect.height > 0;
			});
		});

		it("gives the whole window to the content", function () {
			expect(ctl.content.rect.y).to.equal(0);
			expect(ctl.content.rect.height).to.equal(ctl.getView().rect.height);
		});
	});

	// The shape is the same whatever the aspect: only the proportions differ, so
	// a regression that drops height on one band should be caught on both.
	describe("on a wide screen", function () {
		beforeEach(function () { return openSquare(false); });

		it("starts the content at the top of the window", function () {
			expect(geometry().content.y).to.equal(0);
		});

		it("gives the whole window to the content and the anchor bar", function () {
			var g = geometry();
			// Within a point: the two are percentages of the window and round
			// independently, so 90% + 10% of 402 lands on 401.
			expect(g.content.height + g.bar.height).to.be.closeTo(g.window.height, 1);
		});
	});
});
