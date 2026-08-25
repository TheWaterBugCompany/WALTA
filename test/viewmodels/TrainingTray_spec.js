require("mocha");
const { expect } = require("chai");
const TrainingTrayViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/TrainingTray");

// A Titanium-free stand-in for TrainingTraySource. Cells are addressed by tray
// position, so an unidentified cell is simply absent. Training taxa carry no
// abundance and are never readonly — training is an isolated part of the
// database rather than a historical record being viewed.
function fakeTaxaSource(cells) {
  return {
    length() { return Object.keys(cells).length; },
    at(i) { return cells[i]; },
    surveyType() { return null; },
    readonly: false,
  };
}

// Records the topic events the cell's tap intent fires.
function fakeTopics() {
  return {
    IDENTIFY: "identify",
    SELECT_METHOD: "select_method",
    fired: [],
    fireTopicEvent(event, data) { this.fired.push({ event, data }); },
  };
}

// A training taxon's plain data as the source yields it — no abundance.
function taxon(id) {
  return {
    taxonId: id,
    sampleTaxonId: 1000 + id,
    abundance: null,
    silhouette: `/taxon_${id}.png`,
    name: `Species ${id}`,
  };
}

// Cells 0..n-1 identified, in tray order.
function identified(n) {
  const cells = {};
  for (let i = 0; i < n; i++) cells[i] = taxon(i + 1);
  return cells;
}

// Records the cells it was handed and returns canned per-position verdicts —
// the seam the real TrainingAssessor implements.
function fakeAssessor(verdicts, expectedCount) {
  return {
    expectedCount: expectedCount != null ? expectedCount : (verdicts || []).length,
    calls: [],
    assess(cells) { this.calls.push(cells); return verdicts || []; },
  };
}

// A Topics stand-in with subscribe/unsubscribe so the VM can listen for the
// Assess intent fired by the anchor bar.
function subscribableTopics() {
  const subs = {};
  return {
    ASSESS: "assess",
    subscribe(t, cb) { (subs[t] = subs[t] || []).push(cb); },
    unsubscribe(t, cb) { subs[t] = (subs[t] || []).filter(x => x !== cb); },
    fireTopicEvent(t) { (subs[t] || []).slice().forEach(cb => cb()); },
    count(t) { return (subs[t] || []).length; },
  };
}

// Controllable timers so the notice's dwell/fade run synchronously in tests (no
// real setTimeout leaking past the run). runAll fires every uncleared callback in
// order, including ones a callback schedules.
function fakeTimers() {
  const scheduled = [];
  return {
    setTimer(fn) { scheduled.push({ fn, cleared: false }); return scheduled.length - 1; },
    clearTimer(id) { if (scheduled[id]) scheduled[id].cleared = true; },
    runAll() { for (let i = 0; i < scheduled.length; i++) if (!scheduled[i].cleared) scheduled[i].fn(); },
  };
}

function trainingVm({ cells = {}, expectedCount = 6, verdicts, assessor, topics, timers = fakeTimers() } = {}) {
  const vm = new TrainingTrayViewModel({
    taxaSource: fakeTaxaSource(cells),
    assessor: assessor || fakeAssessor(verdicts, expectedCount),
    topics,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  vm.setViewport({ width: 300, height: 100 });
  return vm;
}

describe("TrainingTrayViewModel", function () {
  it("hides the abundance badge but keeps the silhouette", function () {
    const cell = trainingVm({ cells: identified(6) }).endcapVm.taxa[0];
    expect(cell.abundanceVisible).to.equal(false);
    expect(cell.iconVisible).to.equal(true);
  });

  describe("numbered cells", function () {
    it("numbers each unidentified cell in the order the tray fills", function () {
      const vm = trainingVm({ expectedCount: 7 });
      expect(vm.endcapVm.taxa[0].numberText).to.equal("1");
      expect(vm.endcapVm.taxa[1].numberText).to.equal("2");
      vm.setScrollOffset(0);
      expect(vm.visibleTiles[0].taxa[0].numberText, "first interior cell").to.equal("3");
    });

    it("shows the number only on an unidentified cell", function () {
      const cell = trainingVm({ cells: identified(1), expectedCount: 7 }).endcapVm.taxa[0];
      expect(cell.numberVisible).to.equal(false);
      expect(cell.iconVisible).to.equal(true);
    });

    it("leaves a cell past the exercise's last one unnumbered", function () {
      const vm = trainingVm({ expectedCount: 2 });
      vm.setScrollOffset(0);
      const past = vm.visibleTiles[0].taxa[0];
      expect(past.numberVisible).to.equal(false);
      expect(vm.cellKind(2)).to.equal("blank");
    });

    it("offers no add-to-sample cell — a taxon is added by tapping its number", function () {
      const vm = trainingVm({ cells: identified(2), expectedCount: 4 });
      vm.setScrollOffset(0);
      const components = vm.visibleTiles[0].taxa.concat(vm.endcapVm.taxa).map(c => c.component);
      expect(components).to.not.include("SampleTrayPlus");
    });

    it("sizes the tray to the exercise, not to how much has been identified", function () {
      expect(trainingVm({ expectedCount: 7 }).tileCount)
        .to.equal(trainingVm({ cells: identified(7), expectedCount: 7 }).tileCount);
    });
  });

  describe("assessment", function () {
    it("has no verdict until the tray is assessed", function () {
      expect(trainingVm({ cells: identified(6), verdicts: ["incorrect"] }).verdictFor(0)).to.equal(null);
    });

    it("stores the assessor's verdicts against the cell they graded", function () {
      const vm = trainingVm({ cells: identified(6), verdicts: ["incorrect", "correct"], expectedCount: 6 });
      vm.assess();
      expect(vm.endcapVm.taxa[0].verdictImage).to.equal("/images/cross-icon.png");
      expect(vm.endcapVm.taxa[1].verdictImage).to.equal("/images/tick-icon.png");
    });

    it("crosses a cell nobody identified", function () {
      const vm = trainingVm({ expectedCount: 2, verdicts: ["incorrect", "incorrect"] });
      vm.assess();
      expect(vm.endcapVm.taxa[0].verdictVisible).to.equal(true);
      expect(vm.endcapVm.taxa[0].verdictImage).to.equal("/images/cross-icon.png");
    });

    it("hands the assessor one entry per expected cell, in cell order", function () {
      const assessor = fakeAssessor([], 3);
      const vm = trainingVm({ cells: { 2: taxon(9) }, assessor });
      vm.assess();
      expect(assessor.calls[0].map(c => (c ? c.taxonId : null))).to.deep.equal([null, null, 9]);
    });

    it("re-derives the cells on assess so the overlays reveal", function () {
      const vm = trainingVm({ cells: identified(6), verdicts: ["incorrect"], expectedCount: 6 });
      const cell = vm.endcapVm.taxa[0];
      let notified = 0;
      cell.addListener(() => notified++);
      vm.assess();
      expect(notified, "cell re-applies its verdict binding").to.be.greaterThan(0);
      expect(cell.verdictVisible).to.equal(true);
    });

    it("clears the assessment so a taxa edit drops the feedback", function () {
      const vm = trainingVm({ cells: identified(6), verdicts: ["incorrect"], expectedCount: 6 });
      vm.assess();
      vm.clearAssessment();
      expect(vm.verdictFor(0)).to.equal(null);
    });

    it("clears the assessment when the taxa collection changes", function () {
      const vm = trainingVm({ cells: identified(6), verdicts: ["incorrect"], expectedCount: 6 });
      vm.assess();
      vm.refresh();
      expect(vm.verdictFor(0)).to.equal(null);
    });

    it("assesses when the Assess intent is fired on the bus", function () {
      const topics = subscribableTopics();
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "correct"], expectedCount: 2, topics });
      topics.fireTopicEvent(topics.ASSESS);
      expect(vm.verdictFor(0)).to.equal("correct");
    });

    it("stops listening for the Assess intent on dispose", function () {
      const topics = subscribableTopics();
      const vm = trainingVm({ topics });
      expect(topics.count("assess")).to.equal(1);
      vm.dispose();
      expect(topics.count("assess")).to.equal(0);
    });
  });

  describe("success", function () {
    it("announces allCorrect with the cell count when every cell is correct", function () {
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "correct"], expectedCount: 2 });
      let count = null;
      vm.on("allCorrect", (n) => { count = n; });
      vm.assess();
      expect(count).to.equal(2);
    });

    it("does not announce allCorrect when a cell is still unidentified", function () {
      const vm = trainingVm({ cells: identified(1), verdicts: ["correct", "incorrect"], expectedCount: 2 });
      let fired = false;
      vm.on("allCorrect", () => { fired = true; });
      vm.assess();
      expect(fired).to.equal(false);
    });

    it("does not announce allCorrect when a cell is wrong", function () {
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "incorrect"], expectedCount: 2 });
      let fired = false;
      vm.on("allCorrect", () => { fired = true; });
      vm.assess();
      expect(fired).to.equal(false);
    });
  });

  describe("incorrect notice", function () {
    it("shows the notice when at least one cell is wrong", function () {
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "incorrect"], expectedCount: 2 });
      vm.assess();
      expect(vm.noticeVisible).to.equal(true);
    });

    it("keeps the notice hidden when every cell is correct", function () {
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "correct"], expectedCount: 2 });
      vm.assess();
      expect(vm.noticeVisible).to.equal(false);
    });

    it("hides the notice after its dwell and fade", function () {
      const timers = fakeTimers();
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "incorrect"], expectedCount: 2, timers });
      vm.assess();
      expect(vm.noticeVisible, "shown during the dwell").to.equal(true);
      timers.runAll();
      expect(vm.noticeVisible, "hidden after the dwell + fade").to.equal(false);
    });

    it("fires the fade-in then fade-out commands around the dwell", function () {
      const timers = fakeTimers();
      const vm = trainingVm({ cells: identified(2), verdicts: ["correct", "incorrect"], expectedCount: 2, timers });
      const events = [];
      vm.on("fadeInNotice", () => events.push("in"));
      vm.on("fadeOutNotice", () => events.push("out"));
      vm.assess();
      timers.runAll();
      expect(events).to.deep.equal(["in", "out"]);
    });
  });

  describe("cell tap intent", function () {
    it("fires IDENTIFY flagged as training when a taxon is tapped", function () {
      const topics = fakeTopics();
      const cell = trainingVm({ cells: identified(6), topics }).endcapVm.taxa[0];
      cell.tap();
      expect(topics.fired).to.deep.equal([{
        event: "identify",
        data: { sampleTaxonId: 1001, taxonId: 1, readonly: false, position: 0, training: true },
      }]);
    });

    it("targets the tapped taxon's own collection index outside the endcap — the position Training.addTaxon needs to find and replace the right taxon", function () {
      // 6 identified cells fill the endcap [0,1] and the first interior tile
      // [2,4,3,5]. This cell is tile 0's first slot: tile-relative position 0,
      // but its collection index is 2 — the value that must survive to
      // Training.addTaxon(taxonId, position), which matches taxa by their
      // stored position, not a tile-relative slot number that collides across
      // every tile.
      const topics = fakeTopics();
      const vm = trainingVm({ cells: identified(6), topics });
      const cell = (vm.setScrollOffset(0), vm.visibleTiles[0].taxa[0]);
      cell.tap();
      expect(topics.fired).to.deep.equal([{
        event: "identify",
        data: { sampleTaxonId: 1003, taxonId: 3, readonly: false, position: 2, training: true },
      }]);
    });

    it("fires SELECT_METHOD carrying the tapped cell's position when a number is tapped", function () {
      const topics = fakeTopics();
      const vm = trainingVm({ expectedCount: 7, topics });
      vm.setScrollOffset(0);
      vm.visibleTiles[0].taxa[0].tap();
      expect(topics.fired).to.deep.equal([{
        event: "select_method",
        data: { allowAddToSample: true, surveyType: null, unknownBug: true, training: true, position: 2 },
      }]);
    });

    it("is inert on a cell past the exercise's last one", function () {
      const topics = fakeTopics();
      const vm = trainingVm({ expectedCount: 2, topics });
      vm.setScrollOffset(0);
      vm.visibleTiles[0].taxa[0].tap();
      expect(topics.fired).to.deep.equal([]);
    });
  });
});
