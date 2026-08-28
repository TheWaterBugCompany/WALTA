require("mocha");
const { expect } = require("chai");
const GalleryPhotoViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/GalleryPhoto");

// One page of the photo pager, shared by both owners: the key-browsing Gallery
// and the media-zooming PhotoViewer.
//
// Whether a photo can be navigated from is the owner's to say, not the photo's.
// Gallery.js decides it today with `typeof(urlObj) == "object"` — a test against a
// value shaped three functions away, which is how the browse route came to offer
// "Add to sample" on a path that had no sample. Here the Gallery offers a
// navigateTo and the PhotoViewer simply has none, so the viewer route cannot reach
// the key however its photos happen to be shaped.
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

    it("shows the photo it was given", function () {
        const vm = new GalleryPhotoViewModel(viewingOwner(), page({ url: "/photos/b.jpg" }));
        expect(vm.image).to.equal("/photos/b.jpg");
    });

    it("keys off the page so a re-windowed pager retains the views it still holds", function () {
        const vm = new GalleryPhotoViewModel(viewingOwner(), page({ key: "/photos/c.jpg" }));
        expect(vm.key).to.equal("/photos/c.jpg");
    });

    it("names the taxon when its owner offers somewhere to go", function () {
        const vm = new GalleryPhotoViewModel(browsingOwner(), page({ taxon: TAXON }));
        expect(vm.labelVisible).to.be.true;
        expect(vm.taxonName).to.equal("Anisops");
    });

    it("stays silent for an owner that offers no navigation, taxon or not", function () {
        const vm = new GalleryPhotoViewModel(viewingOwner(), page({ taxon: TAXON }));
        expect(vm.labelVisible).to.be.false;
    });

    it("stays silent for a photo with no taxon, however willing the owner", function () {
        const vm = new GalleryPhotoViewModel(browsingOwner(), page({ taxon: null }));
        expect(vm.labelVisible).to.be.false;
    });

    it("sends the taxon to its owner when tapped", function () {
        const owner = browsingOwner();
        new GalleryPhotoViewModel(owner, page({ taxon: TAXON })).tap();
        expect(owner.went).to.deep.equal([TAXON]);
    });

    // The label is the only thing that can be tapped and it is hidden here, but a
    // component that navigates only because nothing is currently on top of it is
    // one refactor away from the bug this split exists to remove.
    it("does not navigate for an owner that offers no navigation", function () {
        const vm = new GalleryPhotoViewModel(viewingOwner(), page({ taxon: TAXON }));
        expect(() => vm.tap()).to.not.throw();
    });
});
