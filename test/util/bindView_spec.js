require("mocha");
const { expect } = require("chai");
const bindView = require("../../walta-app/app/lib/util/bindView");
const ChangeNotifier = require("../../walta-app/app/lib/util/ChangeNotifier");

function makeWidget() {
  const listeners = {};
  return {
    visible: null, text: null, width: null, backgroundColor: null, title: null,
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) {
      listeners[name] = (listeners[name] || []).filter(l => l !== cb);
    },
    fireEvent(name, data) { (listeners[name] || []).forEach(cb => cb(data)); },
  };
}

function makeBackboneTarget() {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    off(name, cb) {
      listeners[name] = (listeners[name] || []).filter(l => l !== cb);
    },
    trigger(name, data) { (listeners[name] || []).forEach(cb => cb(data)); },
  };
}

class TestVM extends ChangeNotifier {
  constructor() {
    super();
    this._status = "idle";
    this._log = false;
    this.toggleCount = 0;
    this.closeCount = 0;
  }
  get status() { return this._status; }
  get logVisible() { return this._log; }
  get greeting() { return this._status === "idle" ? "hi" : "bye"; }
  toggle() { this.toggleCount++; }
  close() { this.closeCount++; }
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

  describe("event wiring", function () {
    it("wires onClick to a VM method via addEventListener", function () {
      bindView($, vm, { label: { onClick: "toggle" } });
      $.label.fireEvent("click");
      expect(vm.toggleCount).to.equal(1);
    });

    it("wires onFoo as event name 'foo' (camelCase → lowercase)", function () {
      bindView($, vm, { label: { onLongpress: "toggle" } });
      $.label.fireEvent("longpress");
      expect(vm.toggleCount).to.equal(1);
    });

    it("falls back to .on/.off for Backbone-style targets", function () {
      $.bbTarget = makeBackboneTarget();
      bindView($, vm, { bbTarget: { onClose: "close" } });
      $.bbTarget.trigger("close");
      expect(vm.closeCount).to.equal(1);
    });

    it("unbind removes event handlers too", function () {
      const unbind = bindView($, vm, { label: { onClick: "toggle" } });
      $.label.fireEvent("click");
      unbind();
      $.label.fireEvent("click");
      expect(vm.toggleCount).to.equal(1);
    });

    it("mixes property bindings and event wiring under one widget key", function () {
      bindView($, vm, { label: { text: "greeting", onClick: "toggle" } });
      expect($.label.text).to.equal("hi");
      $.label.fireEvent("click");
      expect(vm.toggleCount).to.equal(1);
    });

    it("throws when the VM method doesn't exist", function () {
      expect(() => bindView($, vm, { label: { onClick: "nonExistentMethod" } }))
        .to.throw(/nonExistentMethod/);
    });

    it("throws when the VM property bound to an event name isn't a function", function () {
      expect(() => bindView($, vm, { label: { onClick: "greeting" } }))
        .to.throw(/greeting.*function/);
    });

    it("throws when the target has no event mechanism", function () {
      $.plain = { text: null };
      expect(() => bindView($, vm, { plain: { onClick: "toggle" } }))
        .to.throw(/event/i);
    });
  });
});
