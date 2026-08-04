require("mocha");
const { expect } = require("chai");
const createSampleTaxaIcon = require("../../walta-app/app/lib/mvvm/controllers/SampleTaxaIcon");
const SampleTrayViewModel = require("../../walta-app/app/lib/viewmodels/SampleTray");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");

function makeWidget() {
  const listeners = {};
  return {
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    fireEvent(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  };
}

function makeIconView() {
  return {
    SampleTaxaIcon: makeWidget(),
    padIcon: makeWidget(),
    icon: makeWidget(),
    abundance: makeWidget(),
    tap: makeWidget(),
  };
}

function taxon(id, abundance) {
  return { taxonId: id, sampleTaxonId: 1000 + id, abundance, silhouette: `/taxon_${id}.png`, name: `Species ${id}` };
}

function fakeTopics() {
  return {
    IDENTIFY: "identify", SELECT_METHOD: "select_method",
    fired: [], fireTopicEvent(event, data) { this.fired.push({ event, data }); },
  };
}

// A slot VM straight from the tray, so the component binds exactly what it will
// on-device. `kind` selects a taxon cell (filled) or the plus cell (empty).
function slotVm(kind, topics) {
  const taxa = kind === "taxon" ? [taxon(1, "3-5"), taxon(2, "1-2")] : [];
  const source = { length: () => taxa.length, at: (i) => taxa[i], surveyType: () => 3, readonly: false };
  const tray = new SampleTrayViewModel({ taxaSource: source, topics });
  tray.setViewport({ width: 300, height: 100 });
  tray.setScrollOffset(0);
  // 0 taxa → the endcap's first cell is the plus (collectionIndex 0 === length).
  return tray.endcapTiles[0].taxa[0];
}

describe("SampleTaxaIcon controller", function () {
  let view, ctl;

  function build(cellVm) {
    view = makeIconView();
    ctl = createSampleTaxaIcon({ view, args: { rowVm: cellVm }, bindView: makeBinder() });
    return view;
  }

  afterEach(function () { if (ctl) ctl.dispose(); ctl = null; });

  it("binds a taxon cell's image, abundance and accessibility label", function () {
    const $ = build(slotVm("taxon"));
    expect($.icon.image).to.include("/taxon_1.png");
    expect($.abundance.text).to.equal("3-5");
    expect($.padIcon.visible).to.equal(true);
    expect($.tap.accessibilityLabel).to.equal("Taxon 1, Species 1, abundance 3-5");
    expect($.tap.backgroundImage, "no plus background on a taxon").to.equal(undefined);
  });

  it("shows the plus background and hides the icon on a plus cell", function () {
    const $ = build(slotVm("plus"));
    expect($.padIcon.visible).to.equal(false);
    expect($.tap.backgroundImage).to.include("plus-icon.png");
  });

  it("fires the edit intent when the tap surface is clicked (taxon)", function () {
    const topics = fakeTopics();
    const $ = build(slotVm("taxon", topics));
    $.tap.fireEvent("click");
    expect(topics.fired).to.deep.equal([{
      event: "identify", data: { sampleTaxonId: 1001, taxonId: 1, readonly: false },
    }]);
  });

  it("fires the add-to-sample intent when the plus tap surface is clicked", function () {
    const topics = fakeTopics();
    const $ = build(slotVm("plus", topics));
    $.tap.fireEvent("click");
    expect(topics.fired[0].event).to.equal("select_method");
  });

  it("stops binding and firing after dispose", function () {
    const topics = fakeTopics();
    const $ = build(slotVm("taxon", topics));
    ctl.dispose(); ctl = null;
    $.tap.fireEvent("click");
    expect(topics.fired).to.deep.equal([]);
  });
});
