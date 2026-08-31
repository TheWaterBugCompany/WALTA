require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, waitFor } = require("spec/util/TestUtils");
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var GalleryPhotoViewModel = require("mvvm/viewmodels/GalleryPhoto");
var PhotoUtils = require("util/PhotoUtils");

// Renders one page of the photo pager through the View seam (createComponent →
// the Titanium-free component controller's bind). Which owner mounted the page
// decides whether it names its taxon; that rule is covered in Node
// (test/viewmodels/GalleryPhoto_spec.js) — here it is the on-device rendering and
// the platform split of the zoom surface.
describe("GalleryPhoto component", function () {
	var view, comp, win;

	var PHOTO = "/spec/resources/simpleKey1/media/amphipoda_01.jpg";
	var TAXON = { id: "t1", name: "Anisops" };

	// zoom > frame > [ photo, taxonLabel ]
	function frame() { return comp.view.children[0]; }
	function photo() { return frame().children[0]; }
	function taxonLabel() { return frame().children[1]; }

	function render(owner, taxon) {
		var vm = new GalleryPhotoViewModel(owner, { key: PHOTO, url: PHOTO, taxon: taxon }, PhotoUtils.photoSize);
		view = new View(makeTestServices());
		comp = view.createComponent("GalleryPhoto", { rowVm: vm });
		win = wrapViewInWindow(comp.view);
		return windowOpenTest(win);
	}

	function browsingOwner() {
		var went = [];
		return { went: went, navigateTo: function (t) { went.push(t); } };
	}

	function viewingOwner() { return {}; }

	afterEach(async function () {
		if (comp) comp.dispose();
		await closeWindow(win);
	});

	it("renders the photo it was given", async () => {
		await render(viewingOwner(), null);
		await waitFor(function () { return photo().rect.height > 0; });
		expect(photo().image).to.include("amphipoda_01.jpg");
	});

	it("names the taxon for a key-browsing owner", async () => {
		await render(browsingOwner(), TAXON);
		await waitFor(function () { return taxonLabel().visible === true; });
		expect(taxonLabel().text).to.equal("Anisops");
	});

	// The viewer route must not be able to reach the key, whatever shape its
	// photos arrive in — the bug this component's owner-split exists to remove.
	it("leaves the label hidden for a media-viewing owner carrying a taxon", async () => {
		await render(viewingOwner(), TAXON);
		await waitFor(function () { return photo().rect.height > 0; });
		expect(taxonLabel().visible).to.be.false;
	});

	// Two ways to get this wrong, and the component had both: a page laid out at the
	// image's own pixel size overflows the window and is clipped, and a photo given
	// both dimensions is stretched to them. amphipoda_01.jpg is 1024x683.
	it("fits the whole photo on the screen, in its own proportions", async () => {
		await render(viewingOwner(), null);
		await waitFor(function () { return photo().rect.height > 0; });
		var shown = photo().rect, screen = win.rect;
		expect(shown.x + shown.width, "photo fits within the screen").to.be.at.most(screen.width + 1);
		expect(shown.width / shown.height, "photo keeps its source proportions").to.be.closeTo(1024 / 683, 0.05);
	});

	it("uses the full height of the screen it is on", async () => {
		await render(viewingOwner(), null);
		await waitFor(function () { return photo().rect.height > 0; });
		expect(photo().rect.height, "photo is as tall as the window").to.be.closeTo(win.rect.height, 1);
	});

	// The zoom mechanism is the only thing that differs by platform, and it is
	// declared in TSS rather than built in JS — so it is worth proving the
	// qualifiers actually applied on the platform running this.
	it("gives the zoom surface the mechanism its platform zooms with", async () => {
		await render(viewingOwner(), null);
		await waitFor(function () { return photo().rect.height > 0; });
		if (OS_IOS) {
			expect(comp.view.maxZoomScale, "iOS zooms by scaling the scroll surface").to.equal(10.0);
		} else {
			expect(comp.view.scrollingEnabled, "Android wrapper must not take the gesture").to.be.false;
			expect(photo().enableZoomControls, "Android zooms in the image itself").to.be.true;
		}
	});
});
