require("mocha");
const { expect } = require("chai");
const TrainingTrayViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/TrainingTray");

// A Titanium-free stand-in for TrainingTraySource: length() + at(i) returning
// the plain per-taxon data the icon VM needs. Training taxa carry no
// abundance (TrainingTraySource.toIconData always supplies null) and are
// never readonly — training is always editable, an isolated part of the
// database rather than a historical record being viewed.
function fakeTaxaSource(taxa) {
  return {
    length() { return taxa.length; },
    at(i) { return taxa[i]; },
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

function taxaOf(n) {
  return Array.from({ length: n }, (_, i) => taxon(i + 1));
}

// Records the taxa it was handed and returns a canned verdict map keyed by
// sampleTaxonId — the seam the real TrainingAssessor implements.
function fakeAssessor(verdicts) {
  return { calls: [], assess(taxa) { this.calls.push(taxa); return verdicts || {}; } };
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

function trainingVm(len, assessor, topics, timers = fakeTimers()) {
  const vm = new TrainingTrayViewModel({
    taxaSource: fakeTaxaSource(taxaOf(len)),
    assessor: assessor || fakeAssessor({}),
    topics,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  vm.setViewport({ width: 300, height: 100 });
  return vm;
}

describe("TrainingTrayViewModel", function () {
  // A training session hides the abundance badge, and the verdicts start blank
  // — the tick/cross overlay only appears once the tray is assessed. The verdict
  // itself comes from an injected assessor (stubbed here / real grader later),
  // keyed by sampleTaxonId.

  it("hides the abundance badge but keeps the silhouette", function () {
    const cell = trainingVm(6).endcapVm.taxa[0];
    expect(cell.abundanceVisible).to.equal(false);
    expect(cell.iconVisible).to.equal(true);
  });

  it("has no verdict until the tray is assessed", function () {
    const vm = trainingVm(6, fakeAssessor({ 1001: "incorrect" }));
    expect(vm.verdictFor(1001)).to.equal(null);
  });

  it("stores the assessor's verdicts on assess, keyed by sampleTaxonId", function () {
    const vm = trainingVm(6, fakeAssessor({ 1001: "incorrect", 1002: "correct" }));
    vm.assess();
    expect(vm.verdictFor(1001)).to.equal("incorrect");
    expect(vm.verdictFor(1002)).to.equal("correct");
    expect(vm.verdictFor(9999), "unknown taxon").to.equal(null);
  });

  it("hands the assessor the current taxa", function () {
    const assessor = fakeAssessor({});
    const vm = trainingVm(6, assessor);
    vm.assess();
    expect(assessor.calls).to.have.lengthOf(1);
    expect(assessor.calls[0].map(t => t.sampleTaxonId)).to.include(1001);
  });

  it("re-derives the cells on assess so the overlays reveal", function () {
    const vm = trainingVm(6, fakeAssessor({ 1001: "incorrect" }));
    const cell = vm.endcapVm.taxa[0];
    let notified = 0;
    cell.addListener(() => notified++);
    vm.assess();
    expect(notified, "cell re-applies its verdict binding").to.be.greaterThan(0);
    expect(cell.verdictVisible).to.equal(true);
  });

  it("clears the assessment so a taxa edit drops the feedback", function () {
    const vm = trainingVm(6, fakeAssessor({ 1001: "incorrect" }));
    vm.assess();
    vm.clearAssessment();
    expect(vm.verdictFor(1001)).to.equal(null);
  });

  it("clears the assessment when the taxa collection changes", function () {
    const vm = trainingVm(6, fakeAssessor({ 1001: "incorrect" }));
    vm.assess();
    vm.refresh();
    expect(vm.verdictFor(1001)).to.equal(null);
  });

  it("announces allCorrect with the taxon count when every taxon is correct", function () {
    const vm = trainingVm(2, fakeAssessor({ 1001: "correct", 1002: "correct" }));
    let count = null;
    vm.on("allCorrect", (n) => { count = n; });
    vm.assess();
    expect(count).to.equal(2);
  });

  it("does not announce allCorrect when any taxon is incorrect", function () {
    const vm = trainingVm(2, fakeAssessor({ 1001: "correct", 1002: "incorrect" }));
    let fired = false;
    vm.on("allCorrect", () => { fired = true; });
    vm.assess();
    expect(fired).to.equal(false);
  });

  it("shows the incorrect notice when at least one taxon is wrong", function () {
    const vm = trainingVm(2, fakeAssessor({ 1001: "correct", 1002: "incorrect" }));
    vm.assess();
    expect(vm.noticeVisible).to.equal(true);
  });

  it("keeps the notice hidden when every taxon is correct", function () {
    const vm = trainingVm(2, fakeAssessor({ 1001: "correct", 1002: "correct" }));
    vm.assess();
    expect(vm.noticeVisible).to.equal(false);
  });

  it("hides the notice after its dwell and fade", function () {
    const timers = fakeTimers();
    const vm = trainingVm(2, fakeAssessor({ 1002: "incorrect" }), undefined, timers);
    vm.assess();
    expect(vm.noticeVisible, "shown during the dwell").to.equal(true);
    timers.runAll();
    expect(vm.noticeVisible, "hidden after the dwell + fade").to.equal(false);
  });

  it("fires the fade-in then fade-out commands around the dwell", function () {
    const timers = fakeTimers();
    const vm = trainingVm(2, fakeAssessor({ 1002: "incorrect" }), undefined, timers);
    const events = [];
    vm.on("fadeInNotice", () => events.push("in"));
    vm.on("fadeOutNotice", () => events.push("out"));
    vm.assess();
    timers.runAll();
    expect(events).to.deep.equal(["in", "out"]);
  });

  it("assesses when the Assess intent is fired on the bus", function () {
    const topics = subscribableTopics();
    const vm = trainingVm(2, fakeAssessor({ 1001: "correct" }), topics);
    topics.fireTopicEvent(topics.ASSESS);
    expect(vm.verdictFor(1001)).to.equal("correct");
  });

  it("stops listening for the Assess intent on dispose", function () {
    const topics = subscribableTopics();
    const vm = trainingVm(2, fakeAssessor({}), topics);
    expect(topics.count("assess")).to.equal(1);
    vm.dispose();
    expect(topics.count("assess")).to.equal(0);
  });

  describe("cell tap intent", function () {
    it("fires IDENTIFY flagged as training when a taxon is tapped", function () {
      const topics = fakeTopics();
      const cell = trainingVm(6, undefined, topics).endcapVm.taxa[0];
      cell.tap();
      expect(topics.fired).to.deep.equal([{
        event: "identify",
        data: { sampleTaxonId: 1001, taxonId: 1, readonly: false, position: 0, training: true },
      }]);
    });

    it("targets the tapped taxon's own collection index outside the endcap — the position Training.addTaxon needs to find and replace the right taxon", function () {
      // 6 taxa fills the endcap [0,1] and the first interior tile [2,4,3,5].
      // This cell is tile 0's first slot: tile-relative position 0, but its
      // collection index is 2 — the value that must survive to
      // Training.addTaxon(taxonId, position), which matches taxa by their
      // stored (collection-index-space) position, not a tile-relative slot
      // number that collides across every tile.
      const topics = fakeTopics();
      const vm = trainingVm(6, undefined, topics);
      const cell = (vm.setScrollOffset(0), vm.visibleTiles[0].taxa[0]);
      cell.tap();
      expect(topics.fired).to.deep.equal([{
        event: "identify",
        data: { sampleTaxonId: 1003, taxonId: 3, readonly: false, position: 2, training: true },
      }]);
    });

    it("fires SELECT_METHOD flagged as training when a plus cell is tapped", function () {
      const topics = fakeTopics();
      const vm = trainingVm(0, undefined, topics);
      const plus = (vm.setScrollOffset(0), vm.endcapVm.taxa[0]);
      plus.tap();
      expect(topics.fired).to.deep.equal([{
        event: "select_method",
        data: { allowAddToSample: true, surveyType: null, unknownBug: true, training: true },
      }]);
    });

    // "Blank is inert" is the shared engine's own gate (IceCubeTrayViewModel
    // .selectCell) — already covered once there and via SampleTrayViewModel's
    // equivalent test; not re-proven per peer VM.
  });
});
