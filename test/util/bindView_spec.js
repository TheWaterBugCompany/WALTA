require("mocha");
const { expect } = require("chai");
const bindView = require("../../walta-app/app/lib/util/bindView");
const twoWay = bindView.twoWay;
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
    this.picks = [];
  }
  get status() { return this._status; }
  get logVisible() { return this._log; }
  get greeting() { return this._status === "idle" ? "hi" : "bye"; }
  get name() { return this._name === undefined ? "" : this._name; }
  set name(v) { this._name = v; this.notifyListeners(); }
  toggle() { this.toggleCount++; }
  close() { this.closeCount++; }
  pick(...args) { this.picks.push(args); }
}

function makeVm() { return new TestVM(); }

describe("bindView", function () {
  let $, vm;

  beforeEach(function () {
    $ = { label: makeWidget(), pane: makeWidget() };
    vm = makeVm();
  });

  // iOS silently drops some property writes (accessibilityLabel) made before
  // the view is realised, so the first layout is the earliest point the values
  // are guaranteed to stick.
  it("re-applies bindings once the view completes its first layout", function () {
    const view = makeWidget();
    $.getView = () => view;
    bindView($, vm, { label: { text: "greeting" } });

    $.label.text = "dropped by the platform";
    view.fireEvent("postlayout");

    expect($.label.text).to.equal("hi");
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

  it("does not re-assign a property whose value is unchanged", function () {
    bindView($, vm, { label: { text: "greeting" } });
    let sets = 0;
    let stored = $.label.text;
    Object.defineProperty($.label, "text", {
      get() { return stored; },
      set(v) { sets++; stored = v; },
      configurable: true,
    });
    vm.notifyListeners();           // greeting still "hi" — unchanged, no write
    expect(sets).to.equal(0);
    vm._status = "busy";
    vm.notifyListeners();           // now "bye" — changed, one write
    expect(sets).to.equal(1);
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

  describe("palette resolution", function () {
    it("resolves a Symbol VM value through the palette object", function () {
      const sym = Symbol("error");
      Object.defineProperty(vm, "palettedColor", { value: sym, configurable: true });
      const palette = { error: "#FF6161", primary: "#26849D" };
      bindView($, vm, { label: { backgroundColor: "palettedColor" } }, palette);
      expect($.label.backgroundColor).to.equal("#FF6161");
    });

    it("re-resolves through the palette on each notify", function () {
      let current = Symbol("primary");
      Object.defineProperty(vm, "palettedColor", { get() { return current; }, configurable: true });
      const palette = { error: "#FF6161", primary: "#26849D" };
      bindView($, vm, { label: { backgroundColor: "palettedColor" } }, palette);
      expect($.label.backgroundColor).to.equal("#26849D");
      current = Symbol("error");
      vm.notifyListeners();
      expect($.label.backgroundColor).to.equal("#FF6161");
    });

    it("passes non-Symbol values through unchanged even when a palette is supplied", function () {
      const palette = { error: "#FF6161" };
      bindView($, vm, { label: { text: "greeting" } }, palette);
      expect($.label.text).to.equal("hi");
    });

    it("passes Symbol values through unchanged when no palette is supplied", function () {
      const sym = Symbol("error");
      Object.defineProperty(vm, "palettedColor", { value: sym, configurable: true });
      bindView($, vm, { label: { backgroundColor: "palettedColor" } });
      expect($.label.backgroundColor).to.equal(sym);
    });
  });

  describe("two-way binding", function () {
    it("assigns the initial VM value to the widget (VM → widget)", function () {
      vm._name = "seed";
      bindView($, vm, { label: { text: twoWay("name") } });
      expect($.label.text).to.equal("seed");
    });

    it("writes the widget's change value back into the VM (widget → VM)", function () {
      bindView($, vm, { label: { text: twoWay("name") } });
      $.label.fireEvent("change", { value: "typed" });
      expect(vm.name).to.equal("typed");
    });

    it("still pushes VM changes to the widget after notify (VM → widget)", function () {
      bindView($, vm, { label: { text: twoWay("name") } });
      vm._name = "fromModel";
      vm.notifyListeners();
      expect($.label.text).to.equal("fromModel");
    });

    it("does not echo the just-typed value back into the widget (no feedback loop)", function () {
      bindView($, vm, { label: { text: twoWay("name") } });
      let sets = 0;
      // A real text field already holds the typed text when it emits `change`.
      let stored = "abc";
      Object.defineProperty($.label, "text", {
        get() { return stored; },
        set(v) { sets++; stored = v; },
        configurable: true,
      });
      // The setter notifies listeners; applyProps must see the widget already
      // holds this value and skip the write (otherwise a text field resets its cursor).
      $.label.fireEvent("change", { value: "abc" });
      expect(vm.name).to.equal("abc");
      expect(sets).to.equal(0);
    });

    it("unbind detaches the change listener", function () {
      const unbind = bindView($, vm, { label: { text: twoWay("name") } });
      unbind();
      $.label.fireEvent("change", { value: "ignored" });
      expect(vm.name).to.equal("");
    });

    it("throws when the two-way VM property doesn't exist", function () {
      expect(() => bindView($, vm, { label: { text: twoWay("nope") } }))
        .to.throw(/nope/);
    });

    it("throws when the two-way target has no event mechanism", function () {
      $.plain = { text: null };
      expect(() => bindView($, vm, { plain: { text: twoWay("name") } }))
        .to.throw(/event/i);
    });
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

  describe("argument-carrying event handlers (call)", function () {
    const { call } = bindView;

    it("invokes the VM method with the bound argument on the event", function () {
      bindView($, vm, { label: { onClick: call("pick", 5) } });
      $.label.fireEvent("click");
      expect(vm.picks).to.deep.equal([[5]]);
    });

    it("passes multiple bound arguments through", function () {
      bindView($, vm, { label: { onClick: call("pick", 1, 2) } });
      $.label.fireEvent("click");
      expect(vm.picks).to.deep.equal([[1, 2]]);
    });

    it("mixes an arg-carrying handler with a property binding under one widget", function () {
      bindView($, vm, { label: { text: "greeting", onClick: call("pick", 3) } });
      expect($.label.text).to.equal("hi");
      $.label.fireEvent("click");
      expect(vm.picks).to.deep.equal([[3]]);
    });

    it("unbind removes the handler", function () {
      const unbind = bindView($, vm, { label: { onClick: call("pick", 5) } });
      unbind();
      $.label.fireEvent("click");
      expect(vm.picks).to.deep.equal([]);
    });

    it("falls back to .on/.off for Backbone-style targets", function () {
      $.bbTarget = makeBackboneTarget();
      bindView($, vm, { bbTarget: { onClose: call("pick", 9) } });
      $.bbTarget.trigger("close");
      expect(vm.picks).to.deep.equal([[9]]);
    });

    it("throws when the called method doesn't exist", function () {
      expect(() => bindView($, vm, { label: { onClick: call("nope", 1) } }))
        .to.throw(/nope/);
    });

    it("throws when the called name is not a function", function () {
      expect(() => bindView($, vm, { label: { onClick: call("greeting") } }))
        .to.throw(/greeting.*function/);
    });
  });
});
