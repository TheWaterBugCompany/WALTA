require("mocha");
const { expect } = require("chai");
const createSampleTaxaIcon = require("../../walta-app/app/lib/mvvm/controllers/SampleTaxaIcon");
const SampleTrayViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/SampleTray");
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
    verdict: makeWidget(),
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

// A taxon slot VM straight from the tray, so the component binds exactly what it
// will on-device. (The add affordance is a separate component — SampleTrayPlus.)
function taxonSlotVm(topics, readonly) {
  const taxa = [taxon(1, "3-5"), taxon(2, "1-2")];
  const source = { length: () => taxa.length, at: (i) => taxa[i], surveyType: () => 3, readonly: readonly === true };
  const tray = new SampleTrayViewModel({ taxaSource: source, topics });
  tray.setViewport({ width: 300, height: 100 });
  tray.setScrollOffset(0);
  return tray.endcapVm.taxa[0];
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
    const $ = build(taxonSlotVm());
    expect($.icon.image).to.include("/taxon_1.png");
    expect($.abundance.text).to.equal("3-5");
    expect($.padIcon.visible).to.equal(true);
    expect($.tap.accessibilityLabel).to.equal("Taxon 1, Species 1, abundance 3-5");
  });

  it("keeps the verdict overlay hidden until the tray is assessed", function () {
    const $ = build(taxonSlotVm());
    expect($.verdict.visible).to.equal(false);
  });

  it("fires the edit intent when the tap surface is clicked (taxon)", function () {
    const topics = fakeTopics();
    const $ = build(taxonSlotVm(topics));
    $.tap.fireEvent("click");
    expect(topics.fired).to.deep.equal([{
      event: "identify", data: { sampleTaxonId: 1001, taxonId: 1, readonly: false, position: 0 },
    }]);
  });

  it("stops binding and firing after dispose", function () {
    const topics = fakeTopics();
    const $ = build(taxonSlotVm(topics));
    ctl.dispose(); ctl = null;
    $.tap.fireEvent("click");
    expect(topics.fired).to.deep.equal([]);
  });
});
