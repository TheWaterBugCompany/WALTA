require("mocha");
const { expect } = require("chai");
const PhotoPagerViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/PhotoPager");

// The pager both photo screens compose: a window onto a photo list that slides as
// the reader pages, so a key with hundreds of photos mounts a couple of dozen
// views rather than all of them.
//
// Gallery.js does this today by reaching into the ScrollableView — insertViewsAt,
// removeView, and reassigning currentPage to compensate for what it just dropped.
// The arithmetic is the part that goes wrong, and none of it needs Titanium.
describe("PhotoPagerViewModel", function () {
    const PHOTOS = Array.from({ length: 40 }, (_, i) => `p${i}`);

    function build(args) {
        return new PhotoPagerViewModel(Object.assign(
            { photos: PHOTOS, windowSize: 5, maxVisible: 20 }, args));
    }

    function urls(vm) { return vm.pages.map((p) => p.url); }

    it("starts with one window of photos, on the first of them", function () {
        const vm = build();
        expect(urls(vm)).to.deep.equal(["p0", "p1", "p2", "p3", "p4"]);
        expect(vm.currentPage).to.equal(0);
    });

    it("holds a short list whole, with nothing to slide", function () {
        const vm = build({ photos: ["a", "b"] });
        expect(urls(vm)).to.deep.equal(["a", "b"]);
        vm.setPage(1);
        expect(urls(vm)).to.deep.equal(["a", "b"]);
        expect(vm.currentPage).to.equal(1);
    });

    it("extends the window when the reader reaches its last photo", function () {
        const vm = build();
        vm.setPage(4);
        expect(urls(vm)).to.deep.equal(["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"]);
        // The reader has not moved — the photo under them is still p4.
        expect(vm.currentPage).to.equal(4);
    });

    // The whole point of the window: paging forward forever must not accumulate
    // views. Once the cap is reached, extending the front drops from the back.
    it("drops photos behind the reader rather than growing without limit", function () {
        const vm = build();
        for (let page = 4; vm.pages.length < 20; page = vm.currentPage + 5) { vm.setPage(page); }
        expect(vm.pages.length).to.equal(20);

        // The photo the reader is moving to, named before the window slides.
        const target = vm.pages[vm.pages.length - 1].url;
        vm.setPage(vm.pages.length - 1);

        expect(vm.pages.length).to.be.at.most(20);
        // Dropping from the front shifts every index, so the page has to move with
        // them — which is what Gallery.js reassigns currentPage by hand to achieve.
        expect(vm.pages[vm.currentPage].url).to.equal(target);
    });

    it("extends backwards when the reader returns to the first photo", function () {
        const vm = build();
        vm.setPage(4);
        vm.setPage(9);
        const target = vm.pages[0].url;
        vm.setPage(0);
        expect(vm.pages.length).to.be.at.most(20);
        // Photos arriving in front of the reader shift them along by as many.
        expect(vm.pages[vm.currentPage].url).to.equal(target);
    });

    it("stops extending at the end of the photos", function () {
        const vm = build({ photos: ["a", "b", "c", "d", "e", "f"] });
        vm.setPage(4);
        expect(urls(vm)).to.deep.equal(["a", "b", "c", "d", "e", "f"]);
        vm.setPage(5);
        expect(urls(vm)).to.deep.equal(["a", "b", "c", "d", "e", "f"]);
    });

    // bindView's collection diff identifies a child by its key; two pages sharing
    // one would mount a single view (the defect WB-286 hit).
    it("keys every page by the photo it shows", function () {
        expect(build().pages.map((p) => p.key)).to.deep.equal(["p0", "p1", "p2", "p3", "p4"]);
    });

    it("tells its owner when the window or the page moves", function () {
        const vm = build();
        let changes = 0;
        vm.addListener(() => changes++);
        vm.setPage(1);
        expect(changes).to.equal(1);
        vm.setPage(4);
        expect(changes).to.equal(2);
    });

    it("says nothing changed when the reader stays where they are", function () {
        const vm = build();
        let changes = 0;
        vm.addListener(() => changes++);
        vm.setPage(0);
        expect(changes).to.equal(0);
    });
});
