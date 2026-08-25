require("mocha");
const { expect } = require("chai");
const createTrainingTraySource = require("../../walta-app/app/lib/logic/TrainingTraySource");
const SampleTray = require("../../walta-app/app/lib/models/SampleTray");
const Taxon = require("../../walta-app/app/lib/models/Taxon");

// The source is a pure adapter over a SampleTray and the key, so it needs no
// Alloy/Ti globals — a real tray and a fake key are enough.
function fakeKey(byId) {
  return { findTaxonById: (id) => byId[id] };
}

describe("logic/TrainingTraySource", function () {
  const key = fakeKey({
    90: { name: "Baetidae", bluebug: ["/images/baetidae.png"] },
  });

  function trayWith(...taxa) {
    return new SampleTray(taxa);
  }

  it("reports the tray length", function () {
    const tray = trayWith(new Taxon({ id: 1, taxonId: 90, position: 0 }));
    expect(createTrainingTraySource(tray, key, false).length()).to.equal(1);
  });

  it("maps a taxon to icon data, resolving silhouette + name from the key", function () {
    const tray = trayWith(new Taxon({ id: 7, taxonId: 90, position: 0 }));
    expect(createTrainingTraySource(tray, key, false).at(0)).to.deep.equal({
      taxonId: 90,
      sampleTaxonId: 7,
      abundance: null,
      silhouette: "/images/baetidae.png",
      name: "Baetidae",
    });
  });

  it("addresses cells by tray position, not insertion order", function () {
    // Numbered cells let a taxon be identified into any slot, so the tray can be
    // sparse — cell 3 holds the taxon whose position is 3, and cell 0 is empty.
    const tray = trayWith(new Taxon({ id: 7, taxonId: 90, position: 3 }));
    const source = createTrainingTraySource(tray, key, false);
    expect(source.at(0)).to.equal(undefined);
    expect(source.at(3)).to.include({ sampleTaxonId: 7, taxonId: 90 });
  });

  it("returns null surveyType so the key opens at its root (the full key)", function () {
    expect(createTrainingTraySource(trayWith(), key, false).surveyType()).to.equal(null);
  });

  it("notifies through the tray's change events when a taxon is added", function () {
    const tray = trayWith();
    const source = createTrainingTraySource(tray, key, false);
    let notified = 0;
    source.onChange(() => notified++);
    tray.add(new Taxon({ id: 1, taxonId: 90, position: 0 }));
    expect(notified).to.equal(1);
  });

  it("stops notifying after offChange", function () {
    const tray = trayWith();
    const source = createTrainingTraySource(tray, key, false);
    const cb = () => { throw new Error("should not fire after offChange"); };
    source.onChange(cb);
    source.offChange(cb);
    tray.add(new Taxon({ id: 1, taxonId: 90, position: 0 }));
  });

  it("falls back for an unknown taxon", function () {
    const tray = trayWith(new Taxon({ id: 1, taxonId: 999, position: 0 }));
    const data = createTrainingTraySource(tray, key, false).at(0);
    expect(data.silhouette).to.equal("/images/unknown-bug-icon.png");
    expect(data.name).to.equal("unknown");
  });

  it("reflects the readonly flag", function () {
    expect(createTrainingTraySource(trayWith(), key, true).readonly).to.equal(true);
    expect(createTrainingTraySource(trayWith(), key, false).readonly).to.equal(false);
  });
});
