require("mocha");
const { expect } = require("chai");
const createSampleHistoryRow = require("../../walta-app/app/lib/mvvm/controllers/SampleHistoryRow");
const { SampleRowViewModel } = require("../../walta-app/app/lib/mvvm/viewmodels/SampleHistory");
const Topics = require("../../walta-app/app/lib/ui/Topics");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget } = require("../fixtures/fakeWidgets");

// Fake Alloy row controller: the bound columns plus a getView() returning a
// view that records click listeners.
function makeRowController() {
  const listeners = {};
  const rowView = {
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    fireEvent(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  };
  return {
    idColumn: makeWidget({ text: "" }),
    dateCompletedColumn: makeWidget({ text: "" }),
    waterbodyName: makeWidget({ text: "" }),
    boolColumn: makeWidget({ text: "" }),
    getView() { return rowView; },
  };
}

function rowData(overrides) {
  return Object.assign({
    serverId: 42, sampleId: "s1", dateCompleted: "1 Jan", waterbodyName: "Yarra", uploaded: "yes",
  }, overrides);
}

describe("SampleHistoryRow controller", function () {
  let view, rowVm, ctl;

  function build(data) {
    view = makeRowController();
    rowVm = new SampleRowViewModel(rowData(data));
    ctl = createSampleHistoryRow({ view, args: { rowVm }, services: { topics: Topics }, bindView: makeBinder() });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
    Topics.reset();
  });

  it("binds the row view-model's fields into the columns", function () {
    build();
    expect(view.idColumn.text).to.equal("42");
    expect(view.dateCompletedColumn.text).to.equal("1 Jan");
    expect(view.waterbodyName.text).to.equal("Yarra");
    expect(view.boolColumn.text).to.equal("yes");
  });

  it("re-renders when its row view-model updates", function () {
    build();
    rowVm.update(rowData({ waterbodyName: "Merri Creek" }));
    expect(view.waterbodyName.text).to.equal("Merri Creek");
  });

  it("fires EDIT_SAMPLE with its sampleId when tapped (owns the per-row click)", function () {
    build({ sampleId: "abc" });
    let fired = null;
    Topics.subscribe(Topics.EDIT_SAMPLE, (data) => { fired = data; });
    view.getView().fireEvent("click");
    expect(fired).to.deep.equal({ sampleId: "abc" });
  });

  it("stops firing and updating after dispose", function () {
    build();
    let fired = false;
    Topics.subscribe(Topics.EDIT_SAMPLE, () => { fired = true; });
    ctl.dispose();
    ctl = null;
    view.getView().fireEvent("click");
    rowVm.update(rowData({ waterbodyName: "Gone" }));
    expect(fired).to.equal(false);
    expect(view.waterbodyName.text).to.equal("Yarra");
  });
});
