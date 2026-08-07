require("mocha");
const { expect } = require("chai");
const createMethodSelectController = require("../../walta-app/app/lib/mvvm/controllers/MethodSelect");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// Fake MenuButton entry: a settable `disabled` prop + Backbone-style click, as
// the real MenuButton exposes to bindView.
function makeEntry() {
  const listeners = {};
  return {
    disabled: false,
    on(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    off(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    trigger(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  };
}

function makeView({ unknownBug } = {}) {
  const view = {
    keysearch: makeEntry(),
    speedbug: makeEntry(),
    browselist: makeEntry(),
    closeButton: makeEntry(),
  };
  if (unknownBug) view.unknownbug = makeEntry();
  return view;
}

describe("MethodSelect controller", function () {
  let view, closed, ctl;

  function build(args, viewOpts) {
    view = makeView(viewOpts);
    closed = 0;
    ctl = createMethodSelectController({
      view,
      close: () => closed++,
      services: { topics: Topics },
      bindView: makeBinder(),
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

  it("routes the key tap to KEYSEARCH with the caller's payload and closes", function () {
    build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.KEYSEARCH);
    view.keysearch.trigger("click");
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
    expect(closed).to.equal(1);
  });

  it("routes speedbug and browse to their topics with the payload", function () {
    build({ allowAddToSample: true, surveyType: 3 });
    const speedbug = recordTopic(Topics.SPEEDBUG);
    const browse = recordTopic(Topics.BROWSE);
    view.speedbug.trigger("click");
    view.browselist.trigger("click");
    expect(speedbug()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
    expect(browse()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
  });

  it("routes unknownbug to IDENTIFY with a null taxon when present", function () {
    build({}, { unknownBug: true });
    const fired = recordTopic(Topics.IDENTIFY);
    view.unknownbug.trigger("click");
    expect(fired()).to.deep.equal({ taxonId: null });
    expect(closed).to.equal(1);
  });

  it("defaults to a fresh identification when no args are given", function () {
    build();
    const fired = recordTopic(Topics.KEYSEARCH);
    view.keysearch.trigger("click");
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null });
  });

  it("greys the non-key entries in training mode", function () {
    build({ training: true }, { unknownBug: true });
    expect(view.keysearch.disabled).to.equal(false);
    expect(view.speedbug.disabled).to.equal(true);
    expect(view.browselist.disabled).to.equal(true);
    expect(view.unknownbug.disabled).to.equal(true);
  });

  it("does not grey any entry outside training mode", function () {
    build({}, { unknownBug: true });
    expect(view.speedbug.disabled).to.equal(false);
    expect(view.browselist.disabled).to.equal(false);
    expect(view.unknownbug.disabled).to.equal(false);
  });

  it("swallows a tap on a greyed entry — no route, no close", function () {
    build({ training: true });
    const fired = recordTopic(Topics.SPEEDBUG);
    view.speedbug.trigger("click");
    expect(fired()).to.equal(false);
    expect(closed).to.equal(0);
  });

  it("still routes the key in training mode", function () {
    build({ training: true });
    const fired = recordTopic(Topics.KEYSEARCH);
    view.keysearch.trigger("click");
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null });
  });

  it("closes without navigating when the close button is tapped", function () {
    build();
    const fired = recordTopic(Topics.KEYSEARCH);
    view.closeButton.trigger("close");
    expect(closed).to.equal(1);
    expect(fired()).to.equal(false);
  });

  it("stops routing after dispose", function () {
    build();
    ctl.dispose();
    ctl = null;
    const fired = recordTopic(Topics.KEYSEARCH);
    view.keysearch.trigger("click");
    expect(fired()).to.equal(false);
  });
});
