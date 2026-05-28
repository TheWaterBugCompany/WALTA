require("mocha");
const { expect } = require("chai");
const SampleHistoryViewModel = require("../../walta-app/app/lib/viewmodels/SampleHistory");

// In-memory sample source. `loadAll()` returns the current full list;
// `loadOne(id)` returns the entry matching that id (or undefined). Tests
// mutate via `setRows()` / `setRow(id, data)` to simulate the DB changing
// between the VM's reload calls.
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
    callCounts() { return { ...calls }; }
  };
}

// Mimics the real Topics module surface the VM uses — subscribe/unsubscribe
// plus the topic-name constants. `fire()` is test-only.
function fakeTopics() {
  const subscriptions = {};
  return {
    UPLOAD_PROGRESS: "uploadprogress",
    SYNC_FINISHED:   "syncfinished",
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
  describe("rows", function () {
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
    it("subscribes to UPLOAD_PROGRESS and SYNC_FINISHED on construction", function () {
      const topics = fakeTopics();
      new SampleHistoryViewModel({ sampleSource: fakeSampleSource(INITIAL_ROWS()), topics });
      expect(topics.subscriberCount("uploadprogress")).to.equal(1);
      expect(topics.subscriberCount("syncfinished")).to.equal(1);
    });
  });

  describe("UPLOAD_PROGRESS — granular per-row update", function () {
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

    it("is a no-op when the event id doesn't match any current row", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      const before = vm.rows.slice();

      topics.fire("uploadprogress", { id: 9999 });

      expect(vm.rows).to.deep.equal(before);
    });
  });

  describe("SYNC_FINISHED — full reload (structure may have changed)", function () {
    it("calls loadAll() and preserves identity of rows whose ids are still present", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      const rowsBefore = vm.rows.slice();
      const callsAfterCtor = source.callCounts();

      source.setRows([
        { id: 668, dateCompleted: "21/Jun/2021 11:23:00 pm", waterbodyName: "Lake A", uploaded: "Finished" },
        { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "Finished" },
        { id: 666, dateCompleted: "21/Jun/2021 8:23:00 pm",  waterbodyName: "Lake C", uploaded: "Finished" }
      ]);
      topics.fire("syncfinished", { success: true });

      const callsAfterEvent = source.callCounts();
      expect(callsAfterEvent.loadAll - callsAfterCtor.loadAll).to.equal(1);
      vm.rows.forEach((r, i) => expect(r).to.equal(rowsBefore[i]));
      expect(vm.rows[1].uploaded).to.equal("Finished");
    });

    it("appends a freshly constructed row VM for a newly added sample", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      const rowsBefore = vm.rows.slice();

      source.setRows([
        { id: 700, dateCompleted: "22/Jun/2021 8:00:00 am",  waterbodyName: "Lake D", uploaded: "0%" },
        { id: 668, dateCompleted: "21/Jun/2021 11:23:00 pm", waterbodyName: "Lake A", uploaded: "Finished" },
        { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "50%" },
        { id: 666, dateCompleted: "21/Jun/2021 8:23:00 pm",  waterbodyName: "Lake C", uploaded: "0%" }
      ]);
      topics.fire("syncfinished", { success: true });

      expect(vm.rows.map(r => r.id)).to.deep.equal([700, 668, 667, 666]);
      // 668/667/666 keep their original VM instances; 700 is brand new.
      expect(vm.rows[1]).to.equal(rowsBefore[0]);
      expect(vm.rows[2]).to.equal(rowsBefore[1]);
      expect(vm.rows[3]).to.equal(rowsBefore[2]);
    });

    it("drops a row VM when its sample disappears from the source", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });

      source.setRows([
        { id: 668, dateCompleted: "21/Jun/2021 11:23:00 pm", waterbodyName: "Lake A", uploaded: "Finished" },
        { id: 666, dateCompleted: "21/Jun/2021 8:23:00 pm",  waterbodyName: "Lake C", uploaded: "0%" }
      ]);
      topics.fire("syncfinished", { success: true });

      expect(vm.rows.map(r => r.id)).to.deep.equal([668, 666]);
    });

    it("notifies VM listeners when the rows structure changes (add/remove)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.setRows([
        { id: 668, dateCompleted: "21/Jun/2021 11:23:00 pm", waterbodyName: "Lake A", uploaded: "Finished" },
        { id: 666, dateCompleted: "21/Jun/2021 8:23:00 pm",  waterbodyName: "Lake C", uploaded: "0%" }
      ]);
      topics.fire("syncfinished", { success: true });

      expect(structureChangeCount).to.equal(1);
    });

    it("does NOT notify VM listeners when SYNC_FINISHED leaves the row set unchanged in shape", function () {
      // Same ids in the same order — only row-level fields differ. That's a
      // per-row update, not a structural change; bindView re-renders the
      // affected rows but the controller has no setData work to do.
      const source = fakeSampleSource(INITIAL_ROWS());
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: source, topics });
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "Finished" });
      topics.fire("syncfinished", { success: true });

      expect(structureChangeCount).to.equal(0);
    });
  });

  describe("dispose()", function () {
    it("unsubscribes from both topics", function () {
      const topics = fakeTopics();
      const vm = new SampleHistoryViewModel({ sampleSource: fakeSampleSource(INITIAL_ROWS()), topics });
      vm.dispose();
      expect(topics.subscriberCount("uploadprogress")).to.equal(0);
      expect(topics.subscriberCount("syncfinished")).to.equal(0);
    });
  });
});
