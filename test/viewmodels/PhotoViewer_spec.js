require("mocha");
const { expect } = require("chai");
const PhotoViewerViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/PhotoViewer");

// The media-zooming half of what Gallery.js does today: a plain pager over the
// user's own photo files. It has no key and no navigateTo, so the pages it builds
// cannot offer a way into the key however they are shaped — which is the point of
// splitting it from the key-browsing screen rather than sharing one controller
// that decides by argument shape.
describe("PhotoViewerViewModel", function () {
    const PHOTOS = ["/a.jpg", "/b.jpg", "/c.jpg"];

    function build(photos) {
        return new PhotoViewerViewModel({ photos: photos || PHOTOS, photoSize: () => ({ width: 1024, height: 683 }) });
    }

    it("shows a page per photo", function () {
        expect(build().pages.map((p) => p.image)).to.deep.equal(PHOTOS);
    });

    it("starts on the first photo", function () {
        expect(build().currentPage).to.equal(0);
    });

    // The whole reason this screen is separate: no page can name a taxon or lead
    // anywhere, because the screen that owns them offers nowhere to go.
    // Every page is fitted to the same box, and one built after the measurement
    // must not be left unfitted just because it arrived late.
    it("fits the pages it has to the box it was measured at", function () {
        const vm = build();
        vm.setViewport({ width: 874, height: 402 });
        expect(vm.pages.map((p) => p.photoHeight)).to.deep.equal(vm.pages.map(() => 402));
    });

    it("fits a page built after the measurement too", function () {
        const vm = build();
        vm.setViewport({ width: 874, height: 402 });
        void vm.pages;
        vm.setPage(1);
        expect(vm.pages[vm.pages.length - 1].photoHeight).to.equal(402);
    });

    it("builds pages that lead nowhere", function () {
        build().pages.forEach(function (page) {
            expect(page.labelVisible, "a viewer page must not offer navigation").to.be.false;
        });
    });

    it("follows the reader to another photo", function () {
        const vm = build();
        vm.setPage(2);
        expect(vm.currentPage).to.equal(2);
    });

    // The pager binds pages as a collection keyed on the photo, so a page that is
    // still in view must survive as the same object or its view is torn down and
    // rebuilt underneath the reader.
    it("keeps the same page object for a photo that stays in view", function () {
        const vm = build();
        const before = vm.pages[1];
        vm.setPage(1);
        expect(vm.pages[1]).to.equal(before);
    });

    it("marks the dot for the photo in view", function () {
        const vm = build();
        expect(vm.dots.map((d) => d.selected)).to.deep.equal([true, false, false]);
        vm.setPage(2);
        expect(vm.dots.map((d) => d.selected)).to.deep.equal([false, false, true]);
    });

    it("has one dot per photo", function () {
        expect(build().dots).to.have.length(3);
    });

    // One photo is not a sequence, so there is nothing for dots to say.
    it("hides the dots when there is only one photo", function () {
        expect(build(["/only.jpg"]).pagerVisible).to.be.false;
        expect(build().pagerVisible).to.be.true;
    });

    it("reports which photo is showing, for the screen reader", function () {
        const vm = build();
        expect(vm.accessibilityLabel).to.equal("Photo 1");
        vm.setPage(1);
        expect(vm.accessibilityLabel).to.equal("Photo 2");
    });
});
