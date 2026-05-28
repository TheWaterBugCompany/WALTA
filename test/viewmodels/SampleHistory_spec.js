require("mocha");
const { expect } = require("chai");
const SampleHistoryViewModel = require("../../walta-app/app/lib/viewmodels/SampleHistory");
const Topics = require("../../walta-app/app/lib/ui/Topics");

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

const INITIAL_ROWS = () => ([
  { id: 668, dateCompleted: "21/Jun/2021 11:23:00 pm", waterbodyName: "Lake A", uploaded: "Finished" },
  { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "50%" },
  { id: 666, dateCompleted: "21/Jun/2021 8:23:00 pm",  waterbodyName: "Lake C", uploaded: "0%" }
]);

describe("SampleHistoryViewModel", function () {
  const created = [];

  function makeVm(sampleSource) {
    const vm = new SampleHistoryViewModel({ sampleSource, topics: Topics });
    created.push(vm);
    return vm;
  }

  afterEach(function () {
    while (created.length) created.pop().dispose();
  });

  describe("rows (initial)", function () {
    it("exposes one row VM per item returned by loadAll, preserving order", function () {
      const vm = makeVm(fakeSampleSource(INITIAL_ROWS()));
      expect(vm.rows.length).to.equal(3);
      expect(vm.rows.map(r => r.id)).to.deep.equal([668, 667, 666]);
    });

    it("exposes each row's display fields via getters", function () {
      const vm = makeVm(fakeSampleSource(INITIAL_ROWS()));
      const row = vm.rows[1];
      expect(row.id).to.equal(667);
      expect(row.dateCompleted).to.equal("21/Jun/2021 10:23:00 pm");
      expect(row.waterbodyName).to.equal("Lake B");
      expect(row.uploaded).to.equal("50%");
    });
  });

  describe("UPLOAD_PROGRESS — existing row updates", function () {
    it("loads only the affected sample (loadOne, not loadAll) when the event identifies one", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      makeVm(source);
      const callsAfterCtor = source.callCounts();

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      const callsAfterEvent = source.callCounts();
      expect(callsAfterEvent.loadAll - callsAfterCtor.loadAll).to.equal(0);
      expect(callsAfterEvent.loadOne - callsAfterCtor.loadOne).to.equal(1);
    });

    it("mutates the affected row VM in place (same instance, new fields)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);
      const middleBefore = vm.rows[1];

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      expect(vm.rows[1]).to.equal(middleBefore);
      expect(vm.rows[1].uploaded).to.equal("75%");
    });

    it("notifies only the affected row's listeners — untouched rows stay silent", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);
      const seen = { 668: 0, 667: 0, 666: 0 };
      vm.rows.forEach(r => r.addListener(() => { seen[r.id]++; }));

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      expect(seen).to.deep.equal({ 668: 0, 667: 1, 666: 0 });
    });

    it("does NOT notify VM-level listeners when only a row's fields changed (no structural change)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      expect(structureChangeCount).to.equal(0);
    });
  });

  describe("UPLOAD_PROGRESS — newly arrived samples", function () {
    it("adds a new row VM when the event id is unknown but loadOne returns data", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);

      source.addRow({ id: 700, dateCompleted: "22/Jun/2021 8:00:00 am", waterbodyName: "Lake D", uploaded: "0%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 700 });

      const ids = vm.rows.map(r => r.id);
      expect(ids).to.include(700);
      expect(vm.rows.find(r => r.id === 700).uploaded).to.equal("0%");
    });

    it("notifies VM-level listeners when a row is added (structural change)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.addRow({ id: 700, dateCompleted: "22/Jun/2021 8:00:00 am", waterbodyName: "Lake D", uploaded: "0%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 700 });

      expect(structureChangeCount).to.equal(1);
    });
  });

  describe("UPLOAD_PROGRESS — sample removed at source", function () {
    it("drops a row VM when loadOne returns undefined for a known row", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);

      source.removeRow(667);
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      expect(vm.rows.map(r => r.id)).to.deep.equal([668, 666]);
    });

    it("notifies VM-level listeners when a row is removed (structural change)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);
      let structureChangeCount = 0;
      vm.addListener(() => structureChangeCount++);

      source.removeRow(667);
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      expect(structureChangeCount).to.equal(1);
    });
  });

  describe("UPLOAD_PROGRESS — surfaces upstream contract violations", function () {
    it("throws when the event references an id that exists nowhere (unknown row AND no source data)", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      makeVm(source);

      expect(() => Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 9999 }))
        .to.throw(/9999/);
    });

    it("throws when the event carries no id", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      makeVm(source);

      expect(() => Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, {}))
        .to.throw(/id/);
    });
  });

  describe("dispose()", function () {
    it("stops processing UPLOAD_PROGRESS events after dispose", function () {
      const source = fakeSampleSource(INITIAL_ROWS());
      const vm = makeVm(source);
      let rowUpdateCount = 0;
      vm.rows[1].addListener(() => rowUpdateCount++);

      vm.dispose();
      created.splice(created.indexOf(vm), 1);

      source.setRow(667, { id: 667, dateCompleted: "21/Jun/2021 10:23:00 pm", waterbodyName: "Lake B", uploaded: "75%" });
      Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: 667 });

      expect(rowUpdateCount).to.equal(0);
    });
  });
});
