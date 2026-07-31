require("mocha");
const { expect } = require("chai");
const createSampleHistoryController = require("../../walta-app/app/lib/mvvm/controllers/SampleHistory");
const Topics = require("../../walta-app/app/lib/ui/Topics");
const ChangeNotifier = require("../../walta-app/app/lib/util/ChangeNotifier");

function makeTable() {
  return { data: null, setData(d) { this.data = d; }, getView() { return undefined; } };
}

// Fake View.createComponent: returns a handle whose lib is a real emitter, so a
// row's "selected" can be triggered; records every handle it builds.
function makeFakeView() {
  const handles = [];
  return {
    handles,
    createComponent(name, args) {
      const emitter = new ChangeNotifier();
      const handle = {
        rowVm: args.rowVm,
        view: { rowFor: args.rowVm.sampleId },
        lib: { on: (e, cb) => emitter.on(e, cb), emit: (e, d) => emitter.trigger(e, d) },
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
    ctl = createSampleHistoryController({ view, services: { topics: Topics, View: fakeView } });
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

  it("routes a row's selection to the EDIT_SAMPLE topic with its sampleId", function () {
    build([R("a"), R("b")]);
    let fired = null;
    Topics.subscribe(Topics.EDIT_SAMPLE, (data) => { fired = data; });
    fakeView.handles[1].lib.emit("selected", "b");
    expect(fired).to.deep.equal({ sampleId: "b" });
  });

  it("adds a row when an upload-progress event surfaces a new sample", function () {
    build([R("a")]);
    // A new sample "b" appears in the source, then UPLOAD_PROGRESS for it.
    view.sampleSource.loadOne = (id) => (id === "b" ? R("b") : undefined);
    Topics.fireTopicEvent(Topics.UPLOAD_PROGRESS, { id: "b" });
    expect(table.data.length).to.equal(2);
    expect(fakeView.handles.some(h => h.rowVm.sampleId === "b")).to.equal(true);
  });

  it("disposes every row handle on dispose", function () {
    build([R("a"), R("b")]);
    const handles = fakeView.handles.slice();
    ctl.dispose();
    ctl = null;
    expect(handles.every(h => h.disposed)).to.equal(true);
  });
});
