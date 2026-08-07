require("mocha");
const { expect } = require("chai");
const MethodSelectViewModel = require("../../walta-app/app/lib/viewmodels/MethodSelect");
const Topics = require("../../walta-app/app/lib/ui/Topics");

describe("MethodSelectViewModel", function () {
  afterEach(function () { Topics.reset(); });

  function build(args) {
    return new MethodSelectViewModel(Object.assign({ topics: Topics }, args));
  }

  function recordTopic(topic) {
    let fired = false;
    Topics.subscribe(topic, data => { fired = data == null ? true : data; });
    return () => fired;
  }

  it("enables every entry outside training mode", function () {
    const vm = build();
    expect(vm.keysearchEnabled).to.equal(true);
    expect(vm.speedbugEnabled).to.equal(true);
    expect(vm.browseEnabled).to.equal(true);
    expect(vm.unknownbugEnabled).to.equal(true);
  });

  it("enables only the key in training mode", function () {
    const vm = build({ training: true });
    expect(vm.keysearchEnabled).to.equal(true);
    expect(vm.speedbugEnabled).to.equal(false);
    expect(vm.browseEnabled).to.equal(false);
    expect(vm.unknownbugEnabled).to.equal(false);
  });

  it("routes the key to KEYSEARCH with the caller's payload and asks to close", function () {
    const vm = build({ allowAddToSample: true, surveyType: 3 });
    const fired = recordTopic(Topics.KEYSEARCH);
    let closed = 0;
    vm.on("close", () => closed++);
    vm.keysearch();
    expect(fired()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
    expect(closed).to.equal(1);
  });

  it("routes the key even in training mode", function () {
    const vm = build({ training: true });
    const fired = recordTopic(Topics.KEYSEARCH);
    vm.keysearch();
    expect(fired()).to.deep.equal({ allowAddToSample: false, surveyType: null });
  });

  it("does not route a disabled entry in training mode", function () {
    const vm = build({ training: true });
    const fired = recordTopic(Topics.SPEEDBUG);
    let closed = 0;
    vm.on("close", () => closed++);
    vm.speedbug();
    expect(fired()).to.equal(false);
    expect(closed).to.equal(0);
  });

  it("routes speedbug/browse to their topics outside training", function () {
    const vm = build({ allowAddToSample: true, surveyType: 3 });
    const speedbug = recordTopic(Topics.SPEEDBUG);
    const browse = recordTopic(Topics.BROWSE);
    vm.speedbug();
    vm.browselist();
    expect(speedbug()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
    expect(browse()).to.deep.equal({ allowAddToSample: true, surveyType: 3 });
  });

  it("routes unknownbug to IDENTIFY with a null taxon", function () {
    const vm = build();
    const fired = recordTopic(Topics.IDENTIFY);
    vm.unknownbug();
    expect(fired()).to.deep.equal({ taxonId: null });
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
