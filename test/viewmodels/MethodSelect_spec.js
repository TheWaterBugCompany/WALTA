require("mocha");
const { expect } = require("chai");
const MethodSelectViewModel = require("../../walta-app/app/lib/viewmodels/MethodSelect");
const Topics = require("../../walta-app/app/lib/ui/Topics");

describe("MethodSelectViewModel", function () {
  afterEach(function () { Topics.reset(); });

  function build(args) {
    return new MethodSelectViewModel(Object.assign({ topics: Topics }, args));
  }

  function entry(vm, key) {
    return vm.entries.find(e => e.key === key);
  }

  function recordTopic(topic) {
    let fired = false;
    Topics.subscribe(topic, data => { fired = data == null ? true : data; });
    return () => fired;
  }

  it("offers the key, speedbug and browse entries in order", function () {
    const vm = build();
    expect(vm.entries.map(e => e.key)).to.deep.equal(["keysearch", "speedbug", "browselist"]);
  });

  it("adds the unknown-bug entry only when asked", function () {
    expect(build({ unknownBug: true }).entries.map(e => e.key))
      .to.deep.equal(["keysearch", "speedbug", "browselist", "unknownbug"]);
  });

  it("gives each entry its display data", function () {
    const key = entry(build(), "keysearch");
    expect(key.title).to.equal("Key");
    expect(key.icon).to.equal("/images/key-icon.png");
    expect(key.description).to.equal("Questions to help identify your waterbug.");
  });

  it("enables every entry outside training mode", function () {
    const vm = build({ unknownBug: true });
    expect(vm.entries.every(e => !e.disabled)).to.equal(true);
  });

  it("disables all but the key in training mode", function () {
    const vm = build({ training: true, unknownBug: true });
    expect(entry(vm, "keysearch").disabled).to.equal(false);
    expect(entry(vm, "speedbug").disabled).to.equal(true);
    expect(entry(vm, "browselist").disabled).to.equal(true);
    expect(entry(vm, "unknownbug").disabled).to.equal(true);
  });

  it("routes the key to KEYSEARCH with the caller's payload and asks to close", function () {
    const vm = build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.KEYSEARCH);
    let closed = 0;
    vm.on("close", () => closed++);
    entry(vm, "keysearch").select();
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3, position: null });
    expect(closed).to.equal(1);
  });

  it("routes speedbug and browse to their topics with the payload", function () {
    const vm = build({ allowAddToSample: true, surveyType: 3 });
    const speedbug = recordTopic(Topics.SPEEDBUG);
    const browse = recordTopic(Topics.BROWSE);
    entry(vm, "speedbug").select();
    entry(vm, "browselist").select();
    expect(speedbug()).to.deep.equal({ allowAddToSample: true, surveyType: 3, position: null });
    expect(browse()).to.deep.equal({ allowAddToSample: true, surveyType: 3, position: null });
  });

  it("threads a re-identification position into the key payload", function () {
    const vm = build({ training: true, position: 2 });
    const fired = recordTopic(Topics.KEYSEARCH);
    entry(vm, "keysearch").select();
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null, position: 2 });
  });

  it("routes unknownbug to IDENTIFY with a null taxon", function () {
    const vm = build({ unknownBug: true });
    const fired = recordTopic(Topics.IDENTIFY);
    entry(vm, "unknownbug").select();
    expect(fired()).to.deep.equal({ taxonId: null });
  });

  it("still routes the key in training mode", function () {
    const vm = build({ training: true });
    const fired = recordTopic(Topics.KEYSEARCH);
    entry(vm, "keysearch").select();
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null, position: null });
  });

  it("does not route a disabled entry in training mode", function () {
    const vm = build({ training: true });
    const fired = recordTopic(Topics.SPEEDBUG);
    let closed = 0;
    vm.on("close", () => closed++);
    entry(vm, "speedbug").select();
    expect(fired()).to.equal(false);
    expect(closed).to.equal(0);
  });

  it("asks to close without navigating when close is called", function () {
    const vm = build();
    const key = recordTopic(Topics.KEYSEARCH);
    let closed = 0;
    vm.on("close", () => closed++);
    vm.close();
    expect(closed).to.equal(1);
    expect(key()).to.equal(false);
  });
});
