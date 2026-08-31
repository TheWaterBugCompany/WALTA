require("mocha");
const { expect } = require("chai");
const GalleryPhotoViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/GalleryPhoto");

// One page of the photo pager, shared by both owners: the key-browsing Gallery
// and the media-zooming PhotoViewer.
//
describe("GalleryPhotoViewModel", function () {
    const TAXON = { id: "t1", name: "Anisops" };

    // The key-browsing owner: offers somewhere to go.
    function browsingOwner() {
        const went = [];
        return { went, navigateTo(taxon) { went.push(taxon); } };
    }

    // The media-viewing owner: no navigateTo at all.
    function viewingOwner() {
        return {};
    }

    function page(overrides) {
        return Object.assign({ key: "/photos/a.jpg", url: "/photos/a.jpg", taxon: null }, overrides);
    }

    // The photo's own pixel size, which the app reads off the file. 3:2, the shape
    // of every specimen photo in the key.
    function sizer(size) {
        return function () { return size || { width: 1024, height: 683 }; };
    }

    function photoVm(owner, overrides, size) {
        return new GalleryPhotoViewModel(owner, page(overrides), sizer(size));
    }

    // Titanium will not fit a photo to a box: given both dimensions it stretches to
    // them, and given a number for one it works the other out from the photo's own
    // proportions. So the page takes the height it is measured at and lets the
    // width follow.
    // Titanium will not fit a photo to a box, so the scaling is arithmetic here:
    // grow the photo until one dimension runs out, which is what "fill the screen,
    // keeping the aspect ratio" means.
    describe("sizing", function () {
        const SCREEN = { width: 874, height: 402 };

        it("fills what it is in until it has been measured", function () {
            const vm = photoVm(viewingOwner());
            expect(vm.photoWidth).to.equal("100%");
            expect(vm.photoHeight).to.equal("100%");
        });

        // 1024x683 in 874x402: the height runs out first, at a scale of 0.588.
        it("grows a photo to the full height of a screen wider than it", function () {
            const vm = photoVm(viewingOwner());
            vm.setViewport(SCREEN);
            expect({ width: vm.photoWidth, height: vm.photoHeight }).to.deep.equal({ width: 603, height: 402 });
        });

        // A photo small enough to sit inside the screen is scaled up to it, not left
        // stranded at its own pixel size in the middle of the window.
        it("grows a photo smaller than the screen rather than leaving it small", function () {
            const vm = photoVm(viewingOwner(), {}, { width: 200, height: 150 });
            vm.setViewport(SCREEN);
            expect(vm.photoHeight).to.equal(402);
        });

        // The case "usually the height" leaves out: a photo wider in proportion than
        // the screen would run off its sides at full height, so the width binds.
        it("holds a photo wider than the screen to the width instead", function () {
            const vm = photoVm(viewingOwner(), {}, { width: 3000, height: 1000 });
            vm.setViewport(SCREEN);
            expect({ width: vm.photoWidth, height: vm.photoHeight }).to.deep.equal({ width: 874, height: 291 });
        });

        // Titanium emits a postlayout before the frame has converged; a zero-sized
        // reading would collapse the photo rather than size it.
        it("ignores a reading taken before the frame has a size", function () {
            const vm = photoVm(viewingOwner());
            vm.setViewport({ width: 874, height: 0 });
            expect(vm.photoHeight).to.equal("100%");
        });

        it("does not redraw for a repeated reading of the same size", function () {
            const vm = photoVm(viewingOwner());
            vm.setViewport(SCREEN);
            let notified = 0;
            vm.addListener(() => notified++);
            vm.setViewport(SCREEN);
            expect(notified).to.equal(0);
        });

        // A stored path can outlive its file. The page then has nothing to scale, and
        // filling the box is better than taking the screen down with it.
        it("fills its box when the photo cannot be read", function () {
            const vm = new GalleryPhotoViewModel(viewingOwner(), page(), function () { return null; });
            vm.setViewport({ width: 874, height: 402 });
            expect(vm.photoHeight).to.equal("100%");
        });

        // A page is memoised against its photo, so its proportions never change —
        // and reading them means reading the file.
        it("reads the photo's dimensions once", function () {
            let reads = 0;
            const vm = new GalleryPhotoViewModel(viewingOwner(), page(), function () {
                reads++;
                return { width: 1024, height: 683 };
            });
            vm.setViewport(SCREEN);
            void vm.photoWidth;
            vm.setViewport({ width: 800, height: 400 });
            void vm.photoWidth;
            expect(reads).to.equal(1);
        });
    });

    it("shows the photo it was given", function () {
        const vm = photoVm(viewingOwner(), { url: "/photos/b.jpg" });
        expect(vm.image).to.equal("/photos/b.jpg");
    });

    it("keys off the page so a re-windowed pager retains the views it still holds", function () {
        const vm = photoVm(viewingOwner(), { key: "/photos/c.jpg" });
        expect(vm.key).to.equal("/photos/c.jpg");
    });

    it("names the taxon when its owner offers somewhere to go", function () {
        const vm = photoVm(browsingOwner(), { taxon: TAXON });
        expect(vm.labelVisible).to.be.true;
        expect(vm.taxonName).to.equal("Anisops");
    });

    it("stays silent for an owner that offers no navigation, taxon or not", function () {
        const vm = photoVm(viewingOwner(), { taxon: TAXON });
        expect(vm.labelVisible).to.be.false;
    });

    it("stays silent for a photo with no taxon, however willing the owner", function () {
        const vm = photoVm(browsingOwner(), { taxon: null });
        expect(vm.labelVisible).to.be.false;
    });

    it("sends the taxon to its owner when tapped", function () {
        const owner = browsingOwner();
        photoVm(owner, { taxon: TAXON }).tap();
        expect(owner.went).to.deep.equal([TAXON]);
    });

    // The label is the only thing that can be tapped and it is hidden here, but a
    // component that navigates only because nothing is currently on top of it is
    // one refactor away from the bug this split exists to remove.
    it("does not navigate for an owner that offers no navigation", function () {
        const vm = photoVm(viewingOwner(), { taxon: TAXON });
        expect(() => vm.tap()).to.not.throw();
    });
});
