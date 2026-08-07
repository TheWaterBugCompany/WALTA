require("mocha");
const { expect } = require("chai");
const createSampleTrayPlus = require("../../walta-app/app/lib/mvvm/controllers/SampleTrayPlus");
const SampleTrayViewModel = require("../../walta-app/app/lib/viewmodels/SampleTray");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");

function makeWidget() {
  const listeners = {};
  return {
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    fireEvent(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  };
}

function makePlusView() {
  return { SampleTrayPlus: makeWidget(), plus: makeWidget(), tap: makeWidget() };
}

function fakeTopics() {
  return {
    IDENTIFY: "identify", SELECT_METHOD: "select_method",
    fired: [], fireTopicEvent(event, data) { this.fired.push({ event, data }); },
  };
}

// An add-cell slot VM straight from the tray, so the component binds exactly what
// it will on-device. With 0 taxa, the endcap's first cell is the plus (collection
// index 0 === length) and the second is add-behind.
function addSlots(topics, training) {
  const source = { length: () => 0, at: () => undefined, surveyType: () => 3, readonly: false };
  const tray = new SampleTrayViewModel({ taxaSource: source, topics, training: training === true });
  tray.setViewport({ width: 300, height: 100 });
  return tray.endcapVm.taxa;
}

describe("SampleTrayPlus controller", function () {
  let view, ctl;

  function build(cellVm) {
    view = makePlusView();
    ctl = createSampleTrayPlus({ view, args: { rowVm: cellVm }, bindView: makeBinder() });
    return view;
  }

  afterEach(function () { if (ctl) ctl.dispose(); ctl = null; });

  it("shows the plus icon and its label on the plus cell", function () {
    const $ = build(addSlots()[0]);
    expect($.plus.visible).to.equal(true);
    expect($.plus.image).to.include("plus-icon.png");
    expect($.tap.accessibilityLabel).to.equal("Add Sample");
  });

  it("hides the plus icon on an add-behind cell", function () {
    const $ = build(addSlots()[1]);
    expect($.plus.visible).to.equal(false);
    expect($.tap.accessibilityLabel).to.equal("");
  });

  it("fires the add-to-sample intent when the tap surface is clicked", function () {
    const topics = fakeTopics();
    const $ = build(addSlots(topics)[0]);
    $.tap.fireEvent("click");
    expect(topics.fired).to.deep.equal([{
      event: "select_method",
      data: { allowAddToSample: true, surveyType: 3, unknownBug: true, training: false },
    }]);
  });

  it("flags training in the method-select intent from a training tray", function () {
    const topics = fakeTopics();
    const $ = build(addSlots(topics, true)[0]);
    $.tap.fireEvent("click");
    expect(topics.fired[0].data.training).to.equal(true);
  });

  it("stops binding and firing after dispose", function () {
    const topics = fakeTopics();
    const $ = build(addSlots(topics)[0]);
    ctl.dispose(); ctl = null;
    $.tap.fireEvent("click");
    expect(topics.fired).to.deep.equal([]);
  });
});
