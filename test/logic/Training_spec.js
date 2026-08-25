require("mocha");
const { expect } = require("chai");
const createTraining = require("logic/Training");

// In-memory stand-ins for the collaborators Training composes.
function fakeExercises(map) {
  return { loadExercise: (code) => map[String(code)] || null };
}

// A tray that just records what the repo added, standing in for the domain
// SampleTray (the real one is exercised in its own spec).
function fakeTray() {
  return {
    _items: [],
    get length() { return this._items.length; },
    add(t) { this._items.push(t); },
    remove(t) { this._items = this._items.filter((x) => x.id !== t.id); },
    taxa() { return this._items.slice(); },
  };
}

function fakeRepo(tray) {
  return {
    started: null,
    added: [],
    removed: [],
    _seq: 0,
    startSession(code) { this.started = code; tray._items = []; return tray; },
    currentSessionCode() { return this.started; },
    loadTray() { return tray; },
    addTaxon(t, taxonId, position) {
      this.added.push({ tray: t, taxonId, position });
      const taxon = { id: ++this._seq, taxonId, position };
      t.add(taxon);
      return taxon;
    },
    removeTaxon(t, taxon) {
      this.removed.push({ tray: t, taxon });
      t.remove(taxon);
    },
  };
}

describe("logic/Training", function () {
  let tray, repo, exercises, training;

  beforeEach(function () {
    tray = fakeTray();
    repo = fakeRepo(tray);
    exercises = fakeExercises({ "101": [90, 198, 176, 131], "202": [3, 4] });
    training = createTraining({ repo, exercises });
  });

  it("starts a session for a known code and exposes the tray + assessor", function () {
    const started = training.startTraining("101");

    expect(started).to.equal(true);
    expect(repo.started).to.equal("101");
    expect(training.currentTray()).to.equal(tray);
    expect(training.currentAssessor()).to.not.equal(null);
  });

  it("builds the assessor from the exercise's expected order", function () {
    training.startTraining("101");
    const verdicts = training.currentAssessor().assess([
      { taxonId: 90, sampleTaxonId: 1 },
      { taxonId: 999, sampleTaxonId: 2 },
    ]);
    expect(verdicts).to.deep.equal(["correct", "incorrect", "incorrect", "incorrect"]);
  });

  it("refuses an unknown code — no session", function () {
    const started = training.startTraining("999");

    expect(started).to.equal(false);
    expect(repo.started).to.equal(null);
    expect(training.currentTray()).to.equal(null);
  });

  it("recognises a code that maps to an exercise as valid", function () {
    expect(training.isValidCode("101")).to.equal(true);
    expect(training.isValidCode("999")).to.equal(false);
    expect(training.isValidCode("")).to.equal(false);
  });

  it("adds an identified taxon to the session tray, appended at the end", function () {
    training.startTraining("101");
    training.addTaxon(90);
    training.addTaxon(198);

    expect(repo.added).to.deep.equal([
      { tray, taxonId: 90, position: 0 },
      { tray, taxonId: 198, position: 1 },
    ]);
    expect(tray.length).to.equal(2);
  });

  it("re-identifies the taxon at a given position in place, keeping its position", function () {
    training.startTraining("101");
    training.addTaxon(90);    // id 1, position 0
    training.addTaxon(999);   // id 2, position 1 — the wrong one

    training.addTaxon(198, 1); // re-identify the taxon at position 1

    // the taxon at that position was removed and the new one added in its slot
    expect(repo.removed.map((r) => r.taxon.id)).to.deep.equal([2]);
    expect(repo.added[repo.added.length - 1]).to.deep.include({ taxonId: 198, position: 1 });
  });

  it("appends when no position is given, even after a replace", function () {
    training.startTraining("101");
    training.addTaxon(90);     // id 1, position 0
    training.addTaxon(198, 0); // replaces at position 0
    training.addTaxon(176);    // appends

    expect(repo.added[repo.added.length - 1]).to.deep.include({ taxonId: 176, position: 1 });
  });

  it("retains the in-progress tray when the same code is re-entered", function () {
    training.startTraining("101");
    training.addTaxon(90);

    // A fresh Training over the same repo stands in for leaving and re-entering.
    const resumed = createTraining({ repo, exercises });
    expect(resumed.startTraining("101")).to.equal(true);
    expect(resumed.currentTray()).to.equal(tray);
    expect(resumed.currentTray().length, "existing taxon retained").to.equal(1);
    expect(resumed.currentAssessor().assess([{ taxonId: 90, sampleTaxonId: 1 }])[0])
      .to.equal("correct");
  });

  it("clears the tray when a different code is entered", function () {
    training.startTraining("101");
    training.addTaxon(90);

    const switched = createTraining({ repo, exercises });
    expect(switched.startTraining("202")).to.equal(true);
    expect(repo.started, "started a fresh session for the new code").to.equal("202");
    expect(switched.currentTray().length, "old taxa cleared").to.equal(0);
  });
});
