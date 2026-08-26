require("mocha");
const { expect } = require("chai");
const createSampleTaxaIcon = require("../../walta-app/app/lib/mvvm/controllers/SampleTaxaIcon");
const SampleTrayViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/SampleTray");
const TrainingTrayViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/TrainingTray");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget } = require("../fixtures/fakeWidgets");

function makeIconView() {
  return {
    SampleTaxaIcon: makeWidget(),
    padIcon: makeWidget(),
    icon: makeWidget(),
    abundance: makeWidget(),
    number: makeWidget(),
    number: makeWidget(),
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

// The same component renders a training tray's numbered cell, so build that one
// from a real TrainingTrayViewModel too.
function numberedSlotVm(collectionIndex) {
  const source = { length: () => 0, at: () => undefined, surveyType: () => null, readonly: false };
  const tray = new TrainingTrayViewModel({
    taxaSource: source,
    assessor: { expectedCount: 4, assess: () => [] },
    topics: fakeTopics(),
  });
  tray.setViewport({ width: 300, height: 100 });
  tray.setScrollOffset(0);
  return tray.endcapVm.taxa[collectionIndex];
}

// A cell showing a particular number, from a real tray so the component binds
// what it will on-device.
function numberedCellShowing(text, expectedCount) {
  const source = { length: () => 0, at: () => undefined, surveyType: () => null, readonly: false };
  const tray = new TrainingTrayViewModel({
    taxaSource: source,
    assessor: { expectedCount, assess: () => [] },
    topics: fakeTopics(),
  });
  tray.setViewport({ width: 300, height: 100 });
  tray.setScrollOffset(0);
  const cells = tray.visibleTiles.reduce((all, t) => all.concat(t.taxa), []).concat(tray.endcapVm.taxa);
  const cell = cells.filter(c => c.numberText === text)[0];
  if (!cell) throw new Error(`no cell numbered ${text} among ${cells.map(c => c.numberText)}`);
  return cell;
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

  it("binds a numbered cell's number in place of the taxon", function () {
    const $ = build(numberedSlotVm(1));
    expect($.number.text).to.equal("2");
    expect($.number.visible).to.equal(true);
    expect($.padIcon.visible).to.equal(false);
  });

  // Sized for one digit, a two-digit number overflows a label one cell wide and
  // Titanium ellipsizes it — cell 10 rendered as "...". Each extra digit gets a
  // proportionally smaller numeral, so the number takes the same room whatever
  // its length.
  it("sizes a number to fit its cell however many digits it has", function () {
    const oneDigit = parseFloat(build(numberedCellShowing("9", 12)).number.font.fontSize);
    const twoDigits = parseFloat(build(numberedCellShowing("10", 12)).number.font.fontSize);

    expect(twoDigits * 2).to.equal(oneDigit);
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
      event: "identify", data: { sampleTaxonId: 1001, taxonId: 1, readonly: false, position: 0, training: false },
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
