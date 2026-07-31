require("mocha");
const { expect } = require("chai");
const createMethodSelectController = require("../../walta-app/app/lib/mvvm/controllers/MethodSelect");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// Fake Alloy controller: Backbone-style on/off/trigger, matching the events the
// MethodSelect shell emits when an entry is tapped.
function makeView() {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    off(name, cb) {
      if (!name) { for (const k in listeners) delete listeners[k]; return; }
      listeners[name] = (listeners[name] || []).filter(l => l !== cb);
    },
    trigger(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  };
}

describe("MethodSelect controller", function () {
  let view, closed, ctl;

  function build(args) {
    view = makeView();
    closed = 0;
    ctl = createMethodSelectController({
      view,
      close: () => closed++,
      services: { topics: Topics },
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
    Topics.subscribe(topic, data => { fired = data || true; });
    return () => fired;
  }

  it("routes keysearch to the KEYSEARCH topic with the caller's payload and closes", function () {
    build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.KEYSEARCH);
    view.trigger("keysearch");
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
    expect(closed).to.equal(1);
  });

  it("routes speedbug to the SPEEDBUG topic with the payload", function () {
    build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.SPEEDBUG);
    view.trigger("speedbug");
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
  });

  it("routes browselist to the BROWSE topic with the payload", function () {
    build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.BROWSE);
    view.trigger("browselist");
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
  });

  it("routes unknownbug to the IDENTIFY topic with a null taxon", function () {
    build({ unknownBug: true });
    const fired = recordTopic(Topics.IDENTIFY);
    view.trigger("unknownbug");
    expect(fired()).to.deep.equal({ taxonId: null });
    expect(closed).to.equal(1);
  });

  it("defaults the payload to a fresh identification when no args are given", function () {
    build();
    const fired = recordTopic(Topics.KEYSEARCH);
    view.trigger("keysearch");
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null });
  });

  it("closes without navigating when the close button is tapped", function () {
    build();
    view.trigger("close");
    expect(closed).to.equal(1);
  });

  it("stops routing after dispose", function () {
    build();
    ctl.dispose();
    ctl = null;
    const fired = recordTopic(Topics.KEYSEARCH);
    view.trigger("keysearch");
    expect(fired()).to.equal(false);
  });
});
