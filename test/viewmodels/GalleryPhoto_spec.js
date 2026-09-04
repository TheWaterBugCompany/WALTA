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

    function photoVm(owner, overrides) {
        return new GalleryPhotoViewModel(owner, page(overrides));
    }

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
