require("mocha");
const { expect } = require("chai");
const createGalleryPhoto = require("../../walta-app/app/lib/mvvm/controllers/GalleryPhoto");
const GalleryPhotoViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/GalleryPhoto");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget } = require("../fixtures/fakeWidgets");

// One page of the photo pager as its owner mounts it. The rule about which owner
// offers navigation lives in test/viewmodels/GalleryPhoto_spec.js; here it is
// which parts of the page carry the gesture.
describe("GalleryPhoto component", function () {
    const TAXON = { id: "t1", name: "Anisops" };

    let ctl, view, owner;

    function browsingOwner() {
        const went = [];
        return { went, navigateTo(taxon) { went.push(taxon); } };
    }

    function viewingOwner() {
        return {};
    }

    function build(pageOwner, taxon) {
        owner = pageOwner;
        const vm = new GalleryPhotoViewModel(
            owner,
            { key: "/photos/a.jpg", url: "/photos/a.jpg", taxon: taxon || null }
        );
        view = { photo: makeWidget(), taxonLabel: makeWidget() };
        ctl = createGalleryPhoto({
            view,
            args: { rowVm: vm, box: { width: 800, height: 400 } },
            bindView: makeBinder(undefined, undefined, () => ({ width: 1024, height: 683 })),
        });
        return view;
    }

    afterEach(function () { if (ctl) ctl.dispose(); ctl = null; });

    it("opens the taxon when the label is tapped", function () {
        build(browsingOwner(), TAXON).taxonLabel.fireEvent("click");
        expect(owner.went).to.deep.equal([TAXON]);
    });

    // The label is a small target adrift on a full-screen photo, and the photo is
    // the thing a reader is actually pointing at.
    it("opens the taxon when the photo is tapped", function () {
        build(browsingOwner(), TAXON).photo.fireEvent("click");
        expect(owner.went).to.deep.equal([TAXON]);
    });

    // The page is sized from the box the pager handed it, not from anything it
    // measures itself.
    it("fits the photo to the box the pager handed it", function () {
        const v = build(viewingOwner(), TAXON);
        expect([v.photo.width, v.photo.height]).to.deep.equal([600, 400]);
    });

    it("goes nowhere when a media-viewing owner's photo is tapped", function () {
        build(viewingOwner(), TAXON).photo.fireEvent("click");
        expect(owner.went).to.equal(undefined);
    });
});
