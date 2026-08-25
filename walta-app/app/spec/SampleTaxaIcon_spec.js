require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, waitFor } = require("spec/util/TestUtils");
var Topics = require("ui/Topics");
var { View } = require("logic/View");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var SampleTaxaIconViewModel = require("mvvm/viewmodels/SampleTaxaIcon");

// Renders the SampleTaxaIcon slot component and binds a cell view-model through
// the View seam (createComponent → the Titanium-free mvvm controller's bind),
// then checks the training tick/cross overlay. The verdict comes from the tray,
// so the cell is built against a fake tray with a fixed verdict.
describe("SampleTaxaIcon verdict overlay", function () {
  var view, comp, win;

  // children = [ padIcon, numberOutline, number, verdict, tapSurface ] — the
  // verdict ImageView sits above the silhouette, below the tap surface.
  function verdictImageView() { return comp.view.children[3]; }

  function fakeTray(verdict) {
    return { cellWidth: 60, verdictFor: function () { return verdict; }, topics: Topics, readonly: false };
  }

  function renderTaxon(verdict) {
    var iconVm = new SampleTaxaIconViewModel(fakeTray(verdict), 0, 0);
    iconVm.update("taxon", {
      taxonId: 1, sampleTaxonId: 1001, abundance: "1-2",
      silhouette: "/images/unknown-bug-icon.png", name: "Species 1",
    });
    view = new View(makeTestServices());
    comp = view.createComponent("SampleTaxaIcon", { rowVm: iconVm });
    win = wrapViewInWindow(comp.view);
    return windowOpenTest(win);
  }

  afterEach(function (done) {
    comp.dispose();
    closeWindow(win, done);
  });

  it("shows the tick overlay for a correct taxon", function () {
    return renderTaxon("correct").then(function () {
      return waitFor(function () { return verdictImageView().visible === true; });
    }).then(function () {
      expect(verdictImageView().image).to.include("tick-icon.png");
    });
  });

  it("shows the cross overlay for an incorrect taxon", function () {
    return renderTaxon("incorrect").then(function () {
      return waitFor(function () { return verdictImageView().visible === true; });
    }).then(function () {
      expect(verdictImageView().image).to.include("cross-icon.png");
    });
  });

  it("hides the overlay for a taxon with no verdict", function () {
    return renderTaxon(null).then(function () {
      expect(verdictImageView().visible).to.equal(false);
    });
  });
});
