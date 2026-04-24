require("mocha");
const { expect } = require("chai");
const bindView = require("../../walta-app/app/lib/util/bindView");
const ChangeNotifier = require("../../walta-app/app/lib/util/ChangeNotifier");

function makeWidget() {
  return { visible: null, text: null, width: null, backgroundColor: null, title: null };
}

class TestVM extends ChangeNotifier {
  constructor() {
    super();
    this._status = "idle";
    this._log = false;
  }
  get status() { return this._status; }
  get logVisible() { return this._log; }
  get greeting() { return this._status === "idle" ? "hi" : "bye"; }
}

function makeVm() { return new TestVM(); }

describe("bindView", function () {
  let $, vm;

  beforeEach(function () {
    $ = { label: makeWidget(), pane: makeWidget() };
    vm = makeVm();
  });

  it("assigns initial values from the VM on setup", function () {
    bindView($, vm, {
      label: { text: "greeting", visible: "logVisible" },
    });
    expect($.label.text).to.equal("hi");
    expect($.label.visible).to.equal(false);
  });

  it("re-applies bindings when the VM notifies", function () {
    bindView($, vm, { label: { text: "greeting" } });
    vm._status = "busy";
    vm.notifyListeners();
    expect($.label.text).to.equal("bye");
  });

  it("supports multiple bound widgets", function () {
    bindView($, vm, {
      label: { text: "greeting" },
      pane:  { visible: "logVisible" },
    });
    vm._log = true;
    vm.notifyListeners();
    expect($.pane.visible).to.equal(true);
    expect($.label.text).to.equal("hi");
  });

  it("returns an unbind function that stops further updates", function () {
    const unbind = bindView($, vm, { label: { text: "greeting" } });
    unbind();
    vm._status = "busy";
    vm.notifyListeners();
    expect($.label.text).to.equal("hi");
  });

  it("throws when a widget name isn't in $", function () {
    expect(() => bindView($, vm, { missing: { text: "greeting" } }))
      .to.throw(/missing/);
  });

  it("throws when a VM property doesn't exist", function () {
    expect(() => bindView($, vm, { label: { text: "nonExistentProp" } }))
      .to.throw(/nonExistentProp/);
  });
});
