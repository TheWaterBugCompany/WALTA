require("mocha");
const { expect } = require("chai");
const createSampleTray = require("../../walta-app/app/lib/mvvm/controllers/SampleTray");
const SampleTray = require("../../walta-app/app/lib/models/SampleTray");
const Taxon = require("../../walta-app/app/lib/models/Taxon");

// A bindView stub: carries the marker helpers the controller destructures and
// returns a noop unbind — the real view binding is exercised in the device spec
// (walta-app/app/spec/SampleTray_spec.js). This isolates the controller's own
// wiring (source selection + the success translation).
function stubBindView() {
  const fn = function () { return function unbind() {}; };
  ["collection", "component", "input", "measure", "command", "ref", "call", "twoWay"].forEach(
    (m) => { fn[m] = () => ({}); });
  return fn;
}

function fakeKey() { return { findTaxonById: () => ({ name: "x", bluebug: ["/x.png"] }) }; }
function fakePlatform() { return { convertSystemToDip: (x) => x, convertDipToSystem: (x) => x }; }

describe("SampleTray controller (training)", function () {
  it("opens the success modal when the tray assesses all-correct", function () {
    const fired = [];
    const topics = {
      ASSESS: "assess",
      TRAINING_SUCCESS: "trainingsuccess",
      subscribe() {}, unsubscribe() {},
      fireTopicEvent: (t, d) => fired.push({ t, d }),
    };
    const tray = new SampleTray([new Taxon({ id: 1, taxonId: 90, position: 0 })]);
    const assessor = { assess: () => ({ 1: "correct" }) };
    const ctl = createSampleTray({
      view: {},
      args: { tray, key: fakeKey(), training: true, assessor },
      services: { topics, platform: fakePlatform() },
      bindView: stubBindView(),
    });

    ctl.vm.assess();

    expect(fired).to.deep.equal([{ t: "trainingsuccess", d: { correctCount: 1 } }]);
    expect(ctl.vm.noticeVisible, "no incorrect notice on a clean run").to.equal(false);
    ctl.dispose();
  });

  it("does not open the success modal when a taxon is incorrect", function () {
    const fired = [];
    const topics = {
      ASSESS: "assess",
      TRAINING_SUCCESS: "trainingsuccess",
      subscribe() {}, unsubscribe() {},
      fireTopicEvent: (t, d) => fired.push({ t, d }),
    };
    const tray = new SampleTray([
      new Taxon({ id: 1, taxonId: 90, position: 0 }),
      new Taxon({ id: 2, taxonId: 99, position: 1 }),
    ]);
    const assessor = { assess: () => ({ 1: "correct", 2: "incorrect" }) };
    const ctl = createSampleTray({
      view: {},
      args: { tray, key: fakeKey(), training: true, assessor },
      services: { topics, platform: fakePlatform() },
      bindView: stubBindView(),
    });

    ctl.vm.assess();

    expect(fired).to.have.length(0);
    expect(ctl.vm.noticeVisible, "surfaces the incorrect notice instead").to.equal(true);
    ctl.dispose();
  });
});
