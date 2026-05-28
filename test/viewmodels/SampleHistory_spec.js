require("mocha");
const { expect } = require("chai");
const SampleHistoryViewModel = require("../../walta-app/app/lib/viewmodels/SampleHistory");

// In-memory sample source. `loadAll()` returns the current full list
// (used only on construction); `loadOne(id)` returns the entry matching
// that id, or undefined if the sample has been removed. Tests mutate
// via `setRows()` / `setRow(id, data)` / `removeRow(id)` / `addRow(data)`.
function fakeSampleSource(initial) {
  const state = { rows: initial };
  const calls = { loadAll: 0, loadOne: 0 };
  return {
    loadAll() { calls.loadAll++; return state.rows.slice(); },
    loadOne(id) {
      calls.loadOne++;
      return state.rows.find(r => r.id === id);
    },
    setRows(rows) { state.rows = rows; },
    setRow(id, newData) {
      state.rows = state.rows.map(r => r.id === id ? newData : r);
    },
    removeRow(id) {
      state.rows = state.rows.filter(r => r.id !== id);
    },
    addRow(data) {
      state.rows = [data, ...state.rows];
    },
    callCounts() { return { ...calls }; }
  };
}

// Mimics the real Topics module surface the VM uses — subscribe/unsubscribe
// plus the topic-name constant. `fire()` is test-only.
function fakeTopics() {
  const subscriptions = {};
  return {
    UPLOAD_PROGRESS: "uploadprogress",
    subscribe(name, cb) {
      (subscriptions[name] = subscriptions[name] || []).push(cb);
    },
    unsubscribe(name, cb) {
      if (!subscriptions[name]) return;
      subscriptions[name] = subscriptions[name].filter(s => s !== cb);
    },
    fire(name, payload) {
      (subscriptions[name] || []).forEach(cb => cb(payload));
    },
    subscriberCount(name) {
      return (subscriptions[name] || []).length;
    }
  };
}

const INITIAL_ROWS = () => ([
  { id: 668, dateCompleted: "21/Jun/2021 11:23:00 pm", waterbodyName: "Lake A", uploaded: "Finished" },
  { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "50%" },
  { id: 666, dateCompleted: "21/Jun/2021 8:23:00 pm",  waterbodyName: "Lake C", uploaded: "0%" }
]);

describe("SampleHistoryViewModel", function () {
  describe("rows (initial)", function () {
    it("exposes one row VM per item returned by loadAll, preserving order", function () {
      const vm = new SampleHistoryViewModel({
        sampleSource: fakeSampleSource(INITIAL_ROWS()),
        topics: fakeTopics()
      });
      expect(vm.rows.length).to.equal(3);
      expect(vm.rows.map(r => r.id)).to.deep.equal([668, 667, 666]);
    });

    it("exposes each row's display fields via getters", function () {
      const vm = new SampleHistoryViewModel({
        sampleSource: fakeSampleSource(INITIAL_ROWS()),
        topics: fakeTopics()
      });
      const row = vm.rows[1];
      expect(row.id).to.equal(667);
      expect(row.dateCompleted).to.equal("21/Jun/2021 10:23:00 pm");
      expect(row.waterbodyName).to.equal("Lake B");
      expect(row.uploaded).to.equal("50%");
    });
  });

  describe("Topics subscription", function () {
    it("subscribes to UPLOAD_PROGRESS on construction", function () {
      const topics = fakeTopics();
      new SampleHistoryViewModel({ sampleSource: fakeSampleSource(INITIAL_ROWS()), topics });
      expect(topics.subscriberCount("uploadprogress")).to.equal(1);
    });
  });

  describe("UPLOAD_PROGRESS — existing row updates", function () {
    it("loads only the affected sample (loadOne, not loadAll) when the event identifies one", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      const callsAfterCtor = source.callCounts();

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      topics.fire("uploadprogress", { id: 667 });

      const callsAfterEvent = source.callCounts();
      expect(callsAfterEvent.loadAll - callsAfterCtor.loadAll).to.equal(0);
      expect(callsAfterEvent.loadOne - callsAfterCtor.loadOne).to.equal(1);
    });

    it("mutates the affected row VM in place (same instance, new fields)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      const middleBefore = vm.rows[1];

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      topics.fire("uploadprogress", { id: 667 });

      expect(vm.rows[1]).to.equal(middleBefore);
      expect(vm.rows[1].uploaded).to.equal("75%");
    });

    it("notifies only the affected row's listeners — untouched rows stay silent", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      const seen = { 668: 0, 667: 0, 666: 0 };
      vm.rows.forEach(r => r.addListener(() => { seen[r.id]++; }));

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      topics.fire("uploadprogress", { id: 667 });

      expect(seen).to.deep.equal({ 668: 0, 667: 1, 666: 0 });
    });

    it("does NOT notify VM-level listeners when only a row's fields changed (no structural change)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      topics.fire("uploadprogress", { id: 667 });

      expect(structureChangeCount).to.equal(0);
    });
  });

  describe("UPLOAD_PROGRESS — newly arrived samples", function () {
    it("adds a new row VM when the event id is unknown but loadOne returns data", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });

      source.addRow({ id: 700, dateCompleted: "22/Jun/2021 8:00:00 am", waterbodyName: "Lake D", uploaded: "0%" });
      topics.fire("uploadprogress", { id: 700 });

      const ids = vm.rows.map(r => r.id);
      expect(ids).to.include(700);
      expect(vm.rows.find(r => r.id === 700).uploaded).to.equal("0%");
    });

    it("notifies VM-level listeners when a row is added (structural change)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.addRow({ id: 700, dateCompleted: "22/Jun/2021 8:00:00 am", waterbodyName: "Lake D", uploaded: "0%" });
      topics.fire("uploadprogress", { id: 700 });

      expect(structureChangeCount).to.equal(1);
    });
  });

  describe("UPLOAD_PROGRESS — sample removed at source", function () {
    it("drops a row VM when loadOne returns undefined for a known row", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });

      source.removeRow(667);
      topics.fire("uploadprogress", { id: 667 });

      expect(vm.rows.map(r => r.id)).to.deep.equal([668, 666]);
    });

    it("notifies VM-level listeners when a row is removed (structural change)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.removeRow(667);
      topics.fire("uploadprogress", { id: 667 });

      expect(structureChangeCount).to.equal(1);
    });
  });

  describe("UPLOAD_PROGRESS — surfaces upstream contract violations", function () {
    it("throws when the event references an id that exists nowhere (unknown row AND no source data)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      new SampleHistoryViewModel({ sampleSource: source, topics });

      expect(() => topics.fire("uploadprogress", { id: 9999 }))
        .to.throw(/9999/);
    });

    it("throws when the event carries no id", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      new SampleHistoryViewModel({ sampleSource: source, topics });

      expect(() => topics.fire("uploadprogress", {}))
        .to.throw(/id/);
    });
  });

  describe("dispose()", function () {
    it("unsubscribes from UPLOAD_PROGRESS", function () {
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: fakeSampleSource(INITIAL_ROWS()), topics });
      vm.dispose();
      expect(topics.subscriberCount("uploadprogress")).to.equal(0);
    });
  });
});
