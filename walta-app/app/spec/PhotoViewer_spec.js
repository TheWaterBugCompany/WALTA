require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, actionFiresTopicTest, waitFor } = require("spec/util/TestUtils");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var { View } = require("logic/View");
var Topics = require("ui/Topics");

var mediaResource = "/spec/resources/simpleKey1/media/";
var PHOTOS = [
	mediaResource + "amphipoda_01.jpg",
	mediaResource + "amphipoda_02.jpg",
	mediaResource + "amphipoda_03.jpg",
];

// The media-zooming screen: a pager over photo files the caller hands it. The
// windowing and the no-navigation rule are covered in Node
// (test/viewmodels/PhotoViewer_spec.js); here it is the real screen — that the
// pages mount into the ScrollableView at all, that the dots track the reader, and
// that no page can reach the key.
describe("PhotoViewer controller", function () {
	var view, ctl;

	function vm() { return view.getScreenController().vm; }

	function open(photos) {
		view = new View(makeTestServices());
		var opened = view.openView("PhotoViewer", { photos: photos });
		ctl = view.getCurrentController();
		return opened;
	}

	afterEach(async function () {
		if (ctl) await closeWindow(ctl.getView());
		ctl = null;
	});

	it("mounts a page for each photo it was handed", async () => {
		await open(PHOTOS);
		await waitFor(function () { return ctl.scrollView.views.length === PHOTOS.length; });
		expect(ctl.scrollView.views.length).to.equal(PHOTOS.length);
	});

	it("shows one dot per photo", async () => {
		await open(PHOTOS);
		await waitFor(function () { return ctl.pager.children.length === PHOTOS.length; });
		expect(ctl.pager.children.length).to.equal(PHOTOS.length);
	});

	// A single photo has nowhere to page to, so the indicator would be a lie.
	it("hides the dots when there is only one photo", async () => {
		await open([PHOTOS[0]]);
		await waitFor(function () { return ctl.scrollView.views.length === 1; });
		expect(ctl.pager.visible).to.be.false;
	});

	// The reader's own photos are not taxa, so no page here names one — the
	// guarantee the owner split exists to make.
	it("offers no way into the key from any page", async () => {
		await open(PHOTOS);
		await waitFor(function () { return ctl.scrollView.views.length === PHOTOS.length; });
		vm().pages.forEach(function (page) {
			expect(page.labelVisible, "a viewer page must not offer navigation").to.be.false;
		});
	});

	// The pager is measured once and every page fitted to it. amphipoda_01.jpg is
	// 1024x683; the pager is the window less the dot strip. Assert on the drawn
	// photo — the sizing is bindView's now, not anything the view-model reports.
	it("fits each photo to the pager it measured", async () => {
		await open(PHOTOS);
		await waitFor(function () { return ctl.scrollView.views.length === PHOTOS.length; });
		var box = ctl.scrollView.rect;
		// zoom > frame > [ photo, taxonLabel ]
		function photo() { return ctl.scrollView.views[0].children[0].children[0]; }
		// Not "fits inside the pager" — an unfitted photo fills it exactly, so that
		// bound holds in the state this test exists to catch. Wait for the drawn
		// photo to reach the size bindView asked for.
		await waitFor(function () {
			var asked = photo().width;
			return typeof asked === "number" && Math.abs(photo().rect.width - asked) <= 1;
		});
		var shown = photo().rect;
		var seen = `pager ${box.width}x${box.height}, photo ${shown.width}x${shown.height}`;
		expect(shown.width / shown.height, `photo keeps its source proportions — ${seen}`)
			.to.be.closeTo(1024 / 683, 0.05);
		expect(shown.height, `photo fits the pager — ${seen}`).to.be.at.most(box.height + 1);
		expect(shown.width, `photo fits the pager — ${seen}`).to.be.at.most(box.width + 1);
	});

	it("fires BACK when the close button is clicked", async () => {
		await open(PHOTOS);
		await waitFor(function () { return ctl.scrollView.views.length === PHOTOS.length; });
		await actionFiresTopicTest(ctl.closeButton.closeButton, "click", Topics.BACK);
	});
});
