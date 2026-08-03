require("mocha");
const { expect } = require("chai");
const createSampleHistoryController = require("../../walta-app/app/lib/mvvm/controllers/SampleHistory");
const Topics = require("../../walta-app/app/lib/ui/Topics");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");

function makeTable() {
  return { data: null, setData(d) { this.data = d; }, getView() { return undefined; } };
}

// Fake View seam: createComponent records every row handle it builds; the
// handle exposes the view (for setData) and its own dispose. Row-tap routing is
// the row's own concern now, exercised in SampleHistoryRow_spec.
function makeFakeView() {
  const handles = [];
  return {
    handles,
    createComponent(name, args) {
      const handle = {
        rowVm: args.rowVm,
        view: { rowFor: args.rowVm.sampleId },
        disposed: false,
        dispose() { this.disposed = true; },
      };
      handles.push(handle);
      return handle;
    },
  };
}

function makeSampleSource(rows) {
  return {
    loadAll: () => rows.slice(),
    loadOne: (id) => rows.find(r => r.sampleId === id),
  };
}

const R = (sampleId, extra) => Object.assign(
  { sampleId, serverId: 1, dateCompleted: "", waterbodyName: "", uploaded: "" }, extra);

describe("SampleHistory controller", function () {
  let view, table, fakeView, ctl;

  function build(rows) {
    table = makeTable();
    fakeView = makeFakeView();
    view = { sampleSource: makeSampleSource(rows), sampleTable: table, getView() { return undefined; } };
    ctl = createSampleHistoryController({
      view,
      services: { topics: Topics },
      bindView: makeBinder(fakeView.createComponent),
    });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
    Topics.reset();
  });

  it("renders a row per sample through the View component-factory", function () {
    build([R("a"), R("b")]);
    expect(fakeView.handles.map(h => h.rowVm.sampleId)).to.deep.equal(["a", "b"]);
    expect(table.data.length).to.equal(2);
  });

  it("adds a row when an upload-progress event surfaces a new sample", function () {
    build([R("a")]);
    // A new sample "b" appears in the source, then UPLOAD_PROGRESS for it.
    view.sampleSource.loadOne = (id) => (id === "b" ? R("b") : undefined);
    Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: "b" });
    expect(table.data.length).to.equal(2);
    expect(fakeView.handles.some(h => h.rowVm.sampleId === "b")).to.equal(true);
  });

  it("updates an existing row in place without recreating its component", function () {
    build([R("a"), R("b")]);
    const handlesBefore = fakeView.handles.length;
    view.sampleSource.loadOne = (id) => (id === "a" ? R("a", { waterbodyName: "Changed" }) : undefined);
    Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: "a" });
    expect(fakeView.handles.length, "no new row component created").to.equal(handlesBefore);
  });

  it("disposes every row handle on dispose", function () {
    build([R("a"), R("b")]);
    const handles = fakeView.handles.slice();
    ctl.dispose();
    ctl = null;
    expect(handles.every(h => h.disposed)).to.equal(true);
  });
});
