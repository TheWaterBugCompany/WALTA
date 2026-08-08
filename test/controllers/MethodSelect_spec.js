require("mocha");
const { expect } = require("chai");
const createMethodSelectController = require("../../walta-app/app/lib/mvvm/controllers/MethodSelect");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// Container the collection binder adds/removes child views into.
function makeContainer() {
  return {
    children: [],
    add(v) { this.children.push(v); },
    remove(v) { this.children = this.children.filter(c => c !== v); },
  };
}

function makeBackboneTarget() {
  const listeners = {};
  return {
    on(n, cb) { (listeners[n] = listeners[n] || []).push(cb); },
    off(n, cb) { listeners[n] = (listeners[n] || []).filter(l => l !== cb); },
    trigger(n, d) { (listeners[n] || []).forEach(cb => cb(d)); },
  };
}

// Fake View seam: records every entry component built, exposing its row-VM.
function makeFakeView() {
  const handles = [];
  return {
    handles,
    createComponent(name, args) {
      const handle = {
        name, rowVm: args.rowVm, view: { for: args.rowVm.key },
        disposed: false, dispose() { this.disposed = true; },
      };
      handles.push(handle);
      return handle;
    },
  };
}

describe("MethodSelect controller", function () {
  let view, closeButton, fakeView, closed, ctl;

  function build(args) {
    closeButton = makeBackboneTarget();
    fakeView = makeFakeView();
    closed = 0;
    view = { content: makeContainer(), closeButton, getView() { return undefined; } };
    ctl = createMethodSelectController({
      view,
      close: () => closed++,
      services: { topics: Topics },
      bindView: makeBinder(fakeView.createComponent),
      args,
    });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
    Topics.reset();
  });

  function recordTopic(topic) {
    let fired = false;
    Topics.subscribe(topic, data => { fired = data == null ? true : data; });
    return () => fired;
  }

  const byKey = (k) => fakeView.handles.find(h => h.rowVm.key === k).rowVm;

  it("renders a MenuButton per entry, in order", function () {
    build({ unknownBug: true });
    expect(fakeView.handles.map(h => h.name)).to.deep.equal(
      ["MenuButton", "MenuButton", "MenuButton", "MenuButton"]);
    expect(fakeView.handles.map(h => h.rowVm.key)).to.deep.equal(
      ["keysearch", "speedbug", "browselist", "unknownbug"]);
  });

  it("passes the training greying through to the entry row-VMs", function () {
    build({ training: true, unknownBug: true });
    expect(byKey("keysearch").disabled).to.equal(false);
    expect(byKey("speedbug").disabled).to.equal(true);
    expect(byKey("browselist").disabled).to.equal(true);
    expect(byKey("unknownbug").disabled).to.equal(true);
  });

  it("routes an entry's selection through its row-VM and closes", function () {
    build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.SPEEDBUG);
    byKey("speedbug").select();
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3, position: null });
    expect(closed).to.equal(1);
  });

  it("threads a re-identification position from its args into the key route", function () {
    build({ training: true, position: 1 });
    const fired = recordTopic(Topics.KEYSEARCH);
    byKey("keysearch").select();
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null, position: 1 });
  });

  it("closes without navigating when the close button is tapped", function () {
    build();
    const key = recordTopic(Topics.KEYSEARCH);
    closeButton.trigger("close");
    expect(closed).to.equal(1);
    expect(key()).to.equal(false);
  });

  it("disposes every entry component on dispose", function () {
    build({ unknownBug: true });
    const handles = fakeView.handles.slice();
    ctl.dispose();
    ctl = null;
    expect(handles.every(h => h.disposed)).to.equal(true);
  });
});
