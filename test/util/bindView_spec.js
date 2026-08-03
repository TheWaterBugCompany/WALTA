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
      bindView($, vm, { label: { backgroundColor: "palettedColor" } }, { palette });
      expect($.label.backgroundColor).to.equal("#FF6161");
    });

    it("re-resolves through the palette on each notify", function () {
      let current = Symbol("primary");
      Object.defineProperty(vm, "palettedColor", { get() { return current; }, configurable: true });
      const palette = { error: "#FF6161", primary: "#26849D" };
      bindView($, vm, { label: { backgroundColor: "palettedColor" } }, { palette });
      expect($.label.backgroundColor).to.equal("#26849D");
      current = Symbol("error");
      vm.notifyListeners();
      expect($.label.backgroundColor).to.equal("#FF6161");
    });

    it("passes non-Symbol values through unchanged even when a palette is supplied", function () {
      const palette = { error: "#FF6161" };
      bindView($, vm, { label: { text: "greeting" } }, { palette });
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

// A collection binding drives the *children* of a container from a VM getter
// that returns a keyed list — generalising the hand-rolled reconcile loops in
// controllers/SampleHistory.js (Map of child controllers) and the SampleTray
// windowing. bindView owns the keyed diff; the injected adapter owns the
// Titanium-specific child create/attach/dispose.
describe("bindView collection binding", function () {
  const { collection } = bindView;

  function makeContainer() {
    const children = [];
    const listeners = {};
    return {
      children,
      add(v) { children.push(v); },
      remove(v) { const i = children.indexOf(v); if (i >= 0) children.splice(i, 1); },
      addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
      removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
      fireEvent(name, data) { (listeners[name] || []).forEach(cb => cb(data)); },
      ids() { return children.map((c) => c.id); },
    };
  }

  class ListVM extends ChangeNotifier {
    constructor(items) { super(); this._items = items || []; }
    get items() { return this._items; }
    set items(v) { this._items = v; this.notifyListeners(); }
  }

  // The adapter is where the Titanium-specific work is injected: create() makes
  // a child view, dispose() tears it down. bindView never touches Ti.
  function makeAdapter() {
    const disposed = [];
    return {
      disposed,
      key: (item) => item.id,
      create: (item) => ({ view: { id: item.id, label: item.label } }),
      dispose: (handle) => disposed.push(handle.view.id),
    };
  }

  it("creates and attaches a child per item on bind", function () {
    const container = makeContainer();
    const vm = new ListVM([{ id: 1, label: "a" }, { id: 2, label: "b" }]);
    bindView({ list: container }, vm, {
      list: { children: collection("items", makeAdapter()) },
    });
    expect(container.ids()).to.deep.equal([1, 2]);
  });

  it("reconciles on notify: adds new, retains existing, disposes removed", function () {
    const container = makeContainer();
    const adapter = makeAdapter();
    const vm = new ListVM([{ id: 1, label: "a" }, { id: 2, label: "b" }]);
    bindView({ list: container }, vm, { list: { children: collection("items", adapter) } });
    const child2Before = container.children.find((c) => c.id === 2);

    vm.items = [{ id: 2, label: "b" }, { id: 3, label: "c" }]; // drop 1, keep 2, add 3

    expect(container.ids()).to.deep.equal([2, 3]);
    expect(adapter.disposed, "only the removed child is disposed").to.deep.equal([1]);
    expect(container.children.find((c) => c.id === 2), "retained child is not recreated")
      .to.equal(child2Before);
  });

  it("unbind disposes every child and stops reconciling", function () {
    const container = makeContainer();
    const adapter = makeAdapter();
    const vm = new ListVM([{ id: 1, label: "a" }, { id: 2, label: "b" }]);
    const unbind = bindView({ list: container }, vm, { list: { children: collection("items", adapter) } });

    unbind();

    expect(adapter.disposed.slice().sort()).to.deep.equal([1, 2]);
    expect(container.children).to.deep.equal([]);
    vm.items = [{ id: 9, label: "z" }]; // a notify after unbind must do nothing
    expect(container.children).to.deep.equal([]);
  });

  // The tray's window changes on scroll, a high-frequency Titanium input. The
  // collection binding reconciles from the container's own scroll event via the
  // injected onScroll hook — WITHOUT a notifyListeners broadcast, so scrolling
  // never re-pulls every other bound property (the fluidity contract).
  class WindowVM extends ChangeNotifier {
    constructor() { super(); this._offset = 0; }
    set offset(x) { this._offset = x; } // deliberately does NOT notify
    get visible() { return [this._offset, this._offset + 1].map((i) => ({ id: i })); }
  }

  // A TableView-style container renders its rows from a whole ordered list
  // (setData), not incremental add/remove. When the adapter provides render(),
  // the binding still owns the keyed diff (create/retain/dispose) but hands the
  // adapter the full ordered handle list to apply, instead of add/remove.
  function makeTableContainer() {
    return {
      data: [],
      setData(views) { this.data = views.slice(); },
      ids() { return this.data.map((v) => v.id); },
      addEventListener() {}, removeEventListener() {},
    };
  }

  function makeRenderAdapter() {
    const disposed = [];
    return {
      disposed,
      key: (it) => it.id,
      create: (it) => ({ view: { id: it.id } }),
      dispose: (h) => disposed.push(h.view.id),
      render: (container, handles) => container.setData(handles.map((h) => h.view)),
    };
  }

  it("render-mode: syncs the whole ordered list via the adapter, reusing retained children", function () {
    const container = makeTableContainer();
    const adapter = makeRenderAdapter();
    const vm = new ListVM([{ id: 1 }, { id: 2 }]);
    bindView({ table: container }, vm, { table: { children: collection("items", adapter) } });
    expect(container.ids()).to.deep.equal([1, 2]);
    const view2Before = container.data.find((v) => v.id === 2);

    vm.items = [{ id: 2 }, { id: 3 }]; // drop 1, keep 2, add 3

    expect(container.ids(), "order follows the VM list").to.deep.equal([2, 3]);
    expect(adapter.disposed, "only the removed child is disposed").to.deep.equal([1]);
    expect(container.data.find((v) => v.id === 2), "retained row is reused, not rebuilt")
      .to.equal(view2Before);
  });

  it("reconciles on the container's scroll event without broadcasting", function () {
    const container = makeContainer();
    const adapter = makeAdapter();
    adapter.scrollEvent = "scroll";
    adapter.onScroll = (e) => { vm.offset = e.x; }; // injected Ti read/convert lives here
    const vm = new WindowVM();
    bindView({ list: container }, vm, { list: { children: collection("visible", adapter) } });
    expect(container.ids(), "initial window").to.deep.equal([0, 1]);

    let notifies = 0;
    const realNotify = vm.notifyListeners.bind(vm);
    vm.notifyListeners = () => { notifies++; realNotify(); };
    container.fireEvent("scroll", { x: 5 });

    expect(container.ids(), "window follows the scroll offset").to.deep.equal([5, 6]);
    expect(notifies, "scroll must not trigger a broadcast").to.equal(0);
  });

  // Naming a component instead of an adapter collapses the per-screen glue to
  // zero: bindView synthesises the adapter from convention — key = item.key,
  // create = the injected createComponent factory, dispose = the handle's own
  // dispose, render-vs-add/remove chosen by feature-detecting setData.
  describe("name convention: collection(getter, componentName)", function () {
    function makeFactory() {
      const built = [];
      const disposed = [];
      const createComponent = (name, args) => {
        const handle = {
          name,
          rowVm: args.rowVm,
          view: { id: args.rowVm.key },
          dispose() { disposed.push(args.rowVm.key); },
        };
        built.push(handle);
        return handle;
      };
      return { built, disposed, createComponent };
    }

    it("creates a child per item via the factory, keyed by item.key, rendered via setData", function () {
      const container = makeTableContainer();
      const { built, createComponent } = makeFactory();
      const vm = new ListVM([{ key: 1 }, { key: 2 }]);
      bindView({ table: container }, vm, {
        table: { children: collection("items", "MyRow") },
      }, { createComponent });
      expect(built.map((h) => h.name)).to.deep.equal(["MyRow", "MyRow"]);
      expect(container.ids()).to.deep.equal([1, 2]);
    });

    it("passes each item to the factory as { rowVm }", function () {
      const container = makeTableContainer();
      const { built, createComponent } = makeFactory();
      const items = [{ key: 1 }, { key: 2 }];
      const vm = new ListVM(items);
      bindView({ table: container }, vm, {
        table: { children: collection("items", "MyRow") },
      }, { createComponent });
      expect(built.map((h) => h.rowVm)).to.deep.equal(items);
    });

    it("falls back to add/remove for a container without setData", function () {
      const container = makeContainer();
      const { createComponent } = makeFactory();
      const vm = new ListVM([{ key: 1 }, { key: 2 }]);
      bindView({ list: container }, vm, {
        list: { children: collection("items", "MyRow") },
      }, { createComponent });
      expect(container.ids()).to.deep.equal([1, 2]);
    });

    it("disposes a removed child via its own dispose()", function () {
      const container = makeTableContainer();
      const { disposed, createComponent } = makeFactory();
      const vm = new ListVM([{ key: 1 }, { key: 2 }]);
      bindView({ table: container }, vm, {
        table: { children: collection("items", "MyRow") },
      }, { createComponent });

      vm.items = [{ key: 2 }]; // drop 1

      expect(disposed).to.deep.equal([1]);
      expect(container.ids()).to.deep.equal([2]);
    });

    it("throws if no createComponent factory is supplied", function () {
      const container = makeTableContainer();
      const vm = new ListVM([{ key: 1 }]);
      expect(() => bindView({ table: container }, vm, {
        table: { children: collection("items", "MyRow") },
      })).to.throw(/createComponent/);
    });
  });

  // makeBinder pre-binds the View-side dependencies (createComponent, palette)
  // so a screen controller receives a ready binder and never wires a Titanium
  // dependency itself — the DSL layer stays pure. The View seam builds one per
  // controller; tests build one the same way.
  describe("makeBinder: pre-bound binder from the View seam", function () {
    it("injects createComponent so a named collection needs no per-call factory", function () {
      const container = makeTableContainer();
      const built = [];
      const createComponent = (name, args) => {
        built.push(name);
        return { view: { id: args.rowVm.key }, dispose() {} };
      };
      const bind = bindView.makeBinder(createComponent);
      const vm = new ListVM([{ key: 1 }]);
      bind({ table: container }, vm, { table: { children: bind.collection("items", "MyRow") } });
      expect(built).to.deep.equal(["MyRow"]);
      expect(container.ids()).to.deep.equal([1]);
    });

    it("injects palette so a Symbol getter resolves without a per-call palette", function () {
      const widget = { backgroundColor: null };
      const vm = new ListVM([]);
      Object.defineProperty(vm, "col", { value: Symbol("error") });
      const bind = bindView.makeBinder(() => {}, { error: "#FF6161" });
      bind({ w: widget }, vm, { w: { backgroundColor: "col" } });
      expect(widget.backgroundColor).to.equal("#FF6161");
    });

    it("exposes the collection / twoWay / call markers", function () {
      const bind = bindView.makeBinder(() => {});
      expect(typeof bind.collection).to.equal("function");
      expect(typeof bind.twoWay).to.equal("function");
      expect(typeof bind.call).to.equal("function");
    });

    it("still honours a per-call option override", function () {
      const container = makeTableContainer();
      const seamFactory = () => { throw new Error("seam factory used"); };
      const built = [];
      const override = (name, args) => { built.push(name); return { view: { id: args.rowVm.key }, dispose() {} }; };
      const bind = bindView.makeBinder(seamFactory);
      const vm = new ListVM([{ key: 1 }]);
      bind({ table: container }, vm, {
        table: { children: bind.collection("items", "MyRow") },
      }, { createComponent: override });
      expect(built).to.deep.equal(["MyRow"]);
    });
  });
});
