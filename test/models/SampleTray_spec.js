require("mocha");
const { expect } = require("chai");
const SampleTray = require("../../walta-app/app/lib/models/SampleTray");
const Taxon = require("../../walta-app/app/lib/models/Taxon");

describe("models/SampleTray", function () {
  function taxon(id, taxonId, position) {
    return new Taxon({ id, taxonId, position });
  }

  it("is empty when constructed with no taxa", function () {
    expect(new SampleTray().length).to.equal(0);
  });

  it("orders taxa by position, not insertion order", function () {
    const tray = new SampleTray();
    tray.add(taxon(2, 9, 1));
    tray.add(taxon(1, 5, 0));
    expect([tray.at(0).taxonId, tray.at(1).taxonId]).to.deep.equal([5, 9]);
  });

  it("hydrates from constructor taxa ordered by position", function () {
    const tray = new SampleTray([taxon(2, 9, 1), taxon(1, 5, 0)]);
    expect(tray.taxa().map(t => t.taxonId)).to.deep.equal([5, 9]);
  });

  it("notifies listeners when a taxon is added", function () {
    const tray = new SampleTray();
    let notified = 0;
    tray.addListener(() => notified++);
    tray.add(taxon(1, 5, 0));
    expect(notified).to.equal(1);
  });

  it("removes a taxon by id and notifies", function () {
    const tray = new SampleTray([taxon(1, 5, 0), taxon(2, 9, 1)]);
    let notified = 0;
    tray.addListener(() => notified++);
    tray.remove(tray.at(0));
    expect(tray.taxa().map(t => t.taxonId)).to.deep.equal([9]);
    expect(notified).to.equal(1);
  });

  it("keeps the same taxonId entered twice as two distinct entries", function () {
    const tray = new SampleTray();
    tray.add(taxon(1, 5, 0));
    tray.add(taxon(2, 5, 1));
    expect(tray.length).to.equal(2);
    expect(tray.taxa().map(t => t.id)).to.deep.equal([1, 2]);
  });
});
