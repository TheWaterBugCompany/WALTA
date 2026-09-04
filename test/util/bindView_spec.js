require("mocha");
const { expect } = require("chai");
const bindView = require("../../walta-app/app/lib/util/bindView");
const twoWay = bindView.twoWay;
const ChangeNotifier = require("../../walta-app/app/lib/util/ChangeNotifier");
const { makeWidget, makeBackboneTarget } = require("../fixtures/fakeWidgets");

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
  get scrollTargetX() { return this._scrollTargetX === undefined ? 0 : this._scrollTargetX; }
  get buttonColor() { return "#26849c"; }
  get buttonPressedColor() { return "#17576a"; }
  get name() { return this._name === undefined ? "" : this._name; }
  set name(v) { this._name = v; this.notifyListeners(); }
  toggle() { this.toggleCount++; }
  close() { this.closeCount++; }
  pick(...args) { this.picks.push(args); }
  // A plain viewport setter — measure() owns the "is the reading usable" gate, so
  // the VM setter has no readiness signal to leak.
  setViewport(v) { this.viewport = v; }
}

function makeVm() { return new TestVM(); }

describe("bindView", function () {
  let $, vm;

  beforeEach(function () {
    $ = { label: makeWidget({ visible: null, text: null, width: null, backgroundColor: null, title: null }), pane: makeWidget({ visible: null, text: null, width: null, backgroundColor: null, title: null }) };
    vm = makeVm();
  });

  // iOS silently drops some property writes (accessibilityLabel) made before
  // the view is realised, so the first layout is the earliest point the values
  // are guaranteed to stick.
  it("re-applies bindings once the view completes its first layout", function () {
    const view = makeWidget({ visible: null, text: null, width: null, backgroundColor: null, title: null });
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

  describe("setter bindings", function () {
    // Some Alloy sub-controllers take their state through a method rather than a
    // property — PhotoSelect's photos arrive via setImage(urls).
    class PhotoVM extends ChangeNotifier {
      constructor() { super(); this._urls = ["a.jpg"]; }
      get photoUrls() { return this._urls; }
      show(urls) { this._urls = urls; this.notifyListeners(); }
    }

    function makeTarget() {
      const calls = [];
      return { calls, setImage(v) { calls.push(v); } };
    }

    it("calls the setter with the VM value on setup", function () {
      const target = makeTarget();
      bindView({ photoSelect: target }, new PhotoVM(), { photoSelect: { setImage: bindView.apply("photoUrls") } });
      expect(target.calls).to.deep.equal([["a.jpg"]]);
    });

    it("calls the setter again when the value changes", function () {
      const target = makeTarget();
      const photoVm = new PhotoVM();
      bindView({ photoSelect: target }, photoVm, { photoSelect: { setImage: bindView.apply("photoUrls") } });
      photoVm.show(["b.jpg"]);
      expect(target.calls).to.deep.equal([["a.jpg"], ["b.jpg"]]);
    });

    it("does not call the setter again for an unchanged value", function () {
      const target = makeTarget();
      const photoVm = new PhotoVM();
      bindView({ photoSelect: target }, photoVm, { photoSelect: { setImage: bindView.apply("photoUrls") } });
      photoVm.notifyListeners();
      expect(target.calls).to.have.length(1);
    });
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

  describe("inbound input binding (input)", function () {
    const { input } = bindView;

    it("reads the named widget property and calls the VM setter on the event", function () {
      $.label.contentOffset = { x: 5, y: 0 };
      bindView($, vm, { label: { onScroll: input("pick", "contentOffset") } });
      $.label.fireEvent("scroll");
      expect(vm.picks).to.deep.equal([[{ x: 5, y: 0 }]]);
    });

    it("reads a dotted sub-path off the widget property", function () {
      $.label.contentOffset = { x: 7, y: 0 };
      bindView($, vm, { label: { onScroll: input("pick", "contentOffset.x") } });
      $.label.fireEvent("scroll");
      expect(vm.picks).to.deep.equal([[7]]);
    });

    it("reads the widget property fresh on each event (not once at bind)", function () {
      $.label.contentOffset = { x: 1 };
      bindView($, vm, { label: { onScroll: input("pick", "contentOffset") } });
      $.label.contentOffset = { x: 9 };
      $.label.fireEvent("scroll");
      expect(vm.picks).to.deep.equal([[{ x: 9 }]]);
    });

    it("unbind removes the handler", function () {
      const unbind = bindView($, vm, { label: { onScroll: input("pick", "contentOffset") } });
      unbind();
      $.label.fireEvent("scroll");
      expect(vm.picks).to.deep.equal([]);
    });

    it("throws when the input VM method doesn't exist", function () {
      expect(() => bindView($, vm, { label: { onScroll: input("nope", "contentOffset") } }))
        .to.throw(/nope/);
    });
  });

  describe("inbound measure binding (measure)", function () {
    const { measure } = bindView;

    // Polls the outcome (no fixed sleep) until it holds or the ceiling trips.
    function eventually(fn, timeout = 800) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        (function check() {
          try { fn(); resolve(); }
          catch (e) { Date.now() - start > timeout ? reject(e) : setTimeout(check, 10); }
        })();
      });
    }

    // Android does not fire postlayout again for a widget that was already laid out
    // when its bindings were wired, so a binding that only listens never reads it.
    it("reads a widget that was already laid out before it was bound", function () {
      $.label.size = { width: 10, height: 20 };
      bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      expect(vm.viewport).to.deep.equal({ width: 10, height: 20 });
    });

    it("reads the property and calls the setter once when the reading is usable", function () {
      $.label.size = { width: 10, height: 20 };
      bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      $.label.fireEvent("postlayout");
      expect(vm.viewport).to.deep.equal({ width: 10, height: 20 });
    });

    it("re-measures on each layout so a later, corrected layout wins", function () {
      $.label.size = { width: 10, height: 20 };
      bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      $.label.fireEvent("postlayout");
      expect(vm.viewport).to.deep.equal({ width: 10, height: 20 });
      $.label.size = { width: 30, height: 40 }; // Titanium's next layout corrects it
      $.label.fireEvent("postlayout");
      expect(vm.viewport).to.deep.equal({ width: 30, height: 40 });
    });

    it("waits — does not push — while the reading is a zero-sized (unsettled) frame", function () {
      $.label.size = { width: 10, height: 0 };
      bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      $.label.fireEvent("postlayout");
      expect(vm.viewport, "no push until the layout settles").to.equal(undefined);
    });

    it("retries until the reading settles (Titanium's layout takes time to converge)", async function () {
      $.label.size = { width: 10, height: 0 }; // not laid out yet
      bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      $.label.fireEvent("postlayout");
      $.label.size = { width: 10, height: 20 }; // becomes ready after the event
      await eventually(() => expect(vm.viewport).to.deep.equal({ width: 10, height: 20 }));
    });

    it("tolerates a throwing read and keeps polling", async function () {
      let ready = false;
      Object.defineProperty($.label, "size", {
        get() { if (!ready) throw new Error("activity detached"); return { width: 10, height: 20 }; },
        configurable: true,
      });
      bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      $.label.fireEvent("postlayout");
      ready = true;
      await eventually(() => expect(vm.viewport).to.deep.equal({ width: 10, height: 20 }));
    });

    it("unbind cancels a pending retry", async function () {
      $.label.size = { width: 10, height: 0 };
      const unbind = bindView($, vm, { label: { onPostlayout: measure("setViewport", "size") } });
      $.label.fireEvent("postlayout");
      unbind();
      $.label.size = { width: 10, height: 20 };
      await new Promise(r => setTimeout(r, 250));
      expect(vm.viewport, "never pushed after unbind").to.equal(undefined);
    });

    it("throws when the measure VM method doesn't exist", function () {
      expect(() => bindView($, vm, { label: { onPostlayout: measure("nope", "size") } }))
        .to.throw(/nope/);
    });
  });

  describe("outbound command binding (command)", function () {
    const { command, ref } = bindView;

    function widgetWithCalls() {
      const w = makeWidget({ visible: null, text: null, width: null, backgroundColor: null, title: null });
      w.calls = [];
      w.scrollTo = (...a) => w.calls.push(a);
      return w;
    }

    it("calls the widget method with literal + ref args when the VM fires the event", function () {
      $.label = widgetWithCalls();
      vm._scrollTargetX = 42;
      bindView($, vm, { label: { snap: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: true }) } });
      vm.trigger("scrollToRightEnd");
      expect($.label.calls).to.deep.equal([[42, 0, { animate: true }]]);
    });

    it("resolves ref() args off the VM at fire time (fresh)", function () {
      $.label = widgetWithCalls();
      vm._scrollTargetX = 1;
      bindView($, vm, { label: { snap: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX")) } });
      vm._scrollTargetX = 99;
      vm.trigger("scrollToRightEnd");
      expect($.label.calls).to.deep.equal([[99]]);
    });

    it("unbind unsubscribes from the VM event", function () {
      $.label = widgetWithCalls();
      const unbind = bindView($, vm, { label: { snap: command("scrollToRightEnd", "scrollTo") } });
      unbind();
      vm.trigger("scrollToRightEnd");
      expect($.label.calls).to.deep.equal([]);
    });

    it("throws when the widget has no such method", function () {
      expect(() => bindView($, vm, { label: { snap: command("scrollToRightEnd", "noSuchMethod") } }))
        .to.throw(/noSuchMethod/);
    });
  });

  // Titanium ignores some calls made in the frame of the layout that provoked
  // them — a ScrollView asked to scroll in the turn its content was resized
  // silently stays where it is. Call sites do not say so: bindView owns the
  // layout callbacks, so it knows when a command is being raised from inside
  // one and holds it back until the layout is over.
  describe("outbound commands raised from a layout callback", function () {
    const { command, measure, ref } = bindView;

    function widgetWithCalls() {
      const w = makeWidget({ visible: null, text: null, width: null, backgroundColor: null, title: null });
      w.calls = [];
      w.scrollTo = (...a) => w.calls.push(a);
      w.size = { width: 100, height: 20 };
      return w;
    }

    // The VM reveals an edge in response to being told the widget's new size —
    // which is what a screen does, and which lands inside Titanium's layout pass.
    function vmThatRevealsOnMeasure() {
      const target = { _x: 7 };
      Object.assign(target, makeBackboneTarget());
      target.setSize = function () { target.trigger("reveal"); };
      Object.defineProperty(target, "x", { get: () => target._x });
      target.addListener = () => {};
      target.removeListener = () => {};
      return target;
    }

    it("does not call the widget while the layout callback is still running", function () {
      $.label = widgetWithCalls();
      const vm = vmThatRevealsOnMeasure();
      bindView($, vm, {
        label: { onPostlayout: measure("setSize", "size"), snap: command("reveal", "scrollTo", ref("x"), 0) },
      });
      $.label.calls.length = 0;

      $.label.fireEvent("postlayout");

      expect($.label.calls).to.deep.equal([]);
    });

    it("calls the widget once the layout callback is over", async function () {
      $.label = widgetWithCalls();
      const vm = vmThatRevealsOnMeasure();
      bindView($, vm, {
        label: { onPostlayout: measure("setSize", "size"), snap: command("reveal", "scrollTo", ref("x"), 0) },
      });
      $.label.calls.length = 0;

      $.label.fireEvent("postlayout");
      await new Promise(r => setTimeout(r, 0));

      expect($.label.calls).to.deep.equal([[7, 0]]);
    });

    it("calls the widget straight away when no layout is in progress", function () {
      $.label = widgetWithCalls();
      const vm = vmThatRevealsOnMeasure();
      bindView($, vm, { label: { snap: command("reveal", "scrollTo", ref("x"), 0) } });

      vm.trigger("reveal");

      expect($.label.calls).to.deep.equal([[7, 0]]);
    });

    it("drops a held-back call when the binding is torn down before it runs", async function () {
      $.label = widgetWithCalls();
      const vm = vmThatRevealsOnMeasure();
      const unbind = bindView($, vm, {
        label: { onPostlayout: measure("setSize", "size"), snap: command("reveal", "scrollTo", ref("x"), 0) },
      });
      $.label.calls.length = 0;

      $.label.fireEvent("postlayout");
      unbind();
      await new Promise(r => setTimeout(r, 0));

      expect($.label.calls).to.deep.equal([]);
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

  describe("pressed-state binding (pressable)", function () {
    const { pressable } = bindView;

    it("shows the pressed value while the widget is held down", function () {
      bindView($, vm, { label: { backgroundColor: pressable("buttonColor", "buttonPressedColor") } });

      $.label.fireEvent("touchstart");

      expect($.label.backgroundColor).to.equal("#17576a");
    });

    it("returns to the resting value when the touch ends", function () {
      bindView($, vm, { label: { backgroundColor: pressable("buttonColor", "buttonPressedColor") } });

      $.label.fireEvent("touchstart");
      $.label.fireEvent("touchend");

      expect($.label.backgroundColor).to.equal("#26849c");
    });

    // A finger that slides off the control gets a touchcancel and no touchend —
    // without it the control would stay stuck looking pressed.
    it("returns to the resting value when the touch is cancelled", function () {
      bindView($, vm, { label: { backgroundColor: pressable("buttonColor", "buttonPressedColor") } });

      $.label.fireEvent("touchstart");
      $.label.fireEvent("touchcancel");

      expect($.label.backgroundColor).to.equal("#26849c");
    });

    it("drives every pressable property on a control from the one press", function () {
      bindView($, vm, {
        label: {
          backgroundColor: pressable("buttonColor", "buttonPressedColor"),
          title: pressable("buttonColor", "buttonPressedColor"),
        },
      });

      $.label.fireEvent("touchstart");

      expect([$.label.backgroundColor, $.label.title]).to.deep.equal(["#17576a", "#17576a"]);
    });

    it("holds the pressed value through a notify that lands mid-press", function () {
      bindView($, vm, { label: { backgroundColor: pressable("buttonColor", "buttonPressedColor") } });
      $.label.fireEvent("touchstart");

      vm.notifyListeners();

      expect($.label.backgroundColor).to.equal("#17576a");
    });

    it("leaves a plain property binding on the same control alone", function () {
      bindView($, vm, {
        label: { text: "greeting", backgroundColor: pressable("buttonColor", "buttonPressedColor") },
      });

      $.label.fireEvent("touchstart");

      expect($.label.text).to.equal("hi");
    });

    it("unbind stops the control responding to touches", function () {
      const unbind = bindView($, vm, { label: { backgroundColor: pressable("buttonColor", "buttonPressedColor") } });

      unbind();
      $.label.fireEvent("touchstart");

      expect($.label.backgroundColor).to.equal("#26849c");
    });

    it("throws when the pressed getter doesn't exist on the VM", function () {
      expect(() => bindView($, vm, { label: { backgroundColor: pressable("buttonColor", "nope") } }))
        .to.throw(/nope/);
    });

    it("throws when the resting getter doesn't exist on the VM", function () {
      expect(() => bindView($, vm, { label: { backgroundColor: pressable("nope", "buttonPressedColor") } }))
        .to.throw(/nope/);
    });
  });
});

// A collection binding drives the *children* of a container from a VM getter
// that returns a keyed list — generalising the hand-rolled reconcile loops in
// controllers/SampleHistory.js (Map of child controllers) and the SampleTray
// windowing. bindView owns the keyed diff; the injected adapter owns the
// Titanium-specific child create/attach/dispose.
// Titanium will not fit a photo to a box: given both dimensions it stretches to
// them, and what it does with only one set varies by platform and by what the
// widget is mounted in. So the scaling is arithmetic, and it belongs here rather
// than in a view-model that would otherwise have to know that about Titanium.
describe("fitted-size binding (fit)", function () {
  const { fit } = bindView;
  const NATURAL = {
    "/wide.jpg": { width: 1000, height: 500 },
    "/tall.jpg": { width: 500, height: 1000 },
  };
  const measureImage = (url) => NATURAL[url];

  class PhotoVM extends ChangeNotifier {
    constructor(url) { super(); this._url = url; }
    get image() { return this._url; }
    set image(v) { this._url = v; this.notifyListeners(); }
  }

  function bind(url, box) {
    const $ = { photo: makeWidget({ width: null, height: null, image: null }) };
    const vm = new PhotoVM(url);
    const unbind = bindView($, vm, { photo: { image: "image", size: fit("image", box) } }, { measureImage });
    return { $, vm, unbind };
  }

  // The smaller of the two ratios, so the photo grows until one dimension runs
  // out — anything larger would crop, anything else would distort.
  it("grows the photo until its width runs out", function () {
    const { $ } = bind("/wide.jpg", { width: 800, height: 400 });
    expect([$.photo.width, $.photo.height]).to.deep.equal([800, 400]);
  });

  it("grows the photo until its height runs out", function () {
    const { $ } = bind("/tall.jpg", { width: 800, height: 400 });
    expect([$.photo.width, $.photo.height]).to.deep.equal([200, 400]);
  });

  // A photo that has not been given a box yet is better full-bleed for an instant
  // than absent.
  it("fills what it is in until there is a box to fit into", function () {
    const { $ } = bind("/wide.jpg", null);
    expect([$.photo.width, $.photo.height]).to.deep.equal(["100%", "100%"]);
  });

  it("re-fits when the box it was given changes", function () {
    const box = makeObservableBox({ width: 800, height: 400 });
    const { $ } = bind("/wide.jpg", box);
    box.set({ width: 400, height: 400 });
    expect([$.photo.width, $.photo.height]).to.deep.equal([400, 200]);
  });

  // A photo small enough to sit inside the box is scaled up to it, not left
  // stranded at its own pixel size in the middle of the window.
  it("grows a photo smaller than its box rather than leaving it small", function () {
    const $ = { photo: makeWidget({ width: null, height: null, image: null }) };
    const vm = new PhotoVM("/small.jpg");
    bindView($, vm, { photo: { image: "image", size: fit("image", { width: 800, height: 400 }) } },
      { measureImage: () => ({ width: 200, height: 100 }) });
    expect([$.photo.width, $.photo.height]).to.deep.equal([800, 400]);
  });

  // A stored path can outlive its file. There is then nothing to scale, and
  // filling the box beats taking the screen down.
  it("fills its box when the photo cannot be read", function () {
    const $ = { photo: makeWidget({ width: null, height: null, image: null }) };
    const vm = new PhotoVM("/gone.jpg");
    bindView($, vm, { photo: { image: "image", size: fit("image", { width: 800, height: 400 }) } },
      { measureImage: () => null });
    expect([$.photo.width, $.photo.height]).to.deep.equal(["100%", "100%"]);
  });

  // A photo is not always readable the instant the binding first runs — on Android
  // the first read of a freshly-mounted page comes back empty. Remembering that as
  // the answer leaves the photo stretched to its box for the life of the screen.
  it("tries again after a reading that failed, rather than remembering the failure", function () {
    let readable = false;
    const $ = { photo: makeWidget({ width: null, height: null, image: null }) };
    const vm = new PhotoVM("/late.jpg");
    bindView($, vm, { photo: { image: "image", size: fit("image", { width: 800, height: 400 }) } },
      { measureImage: () => (readable ? { width: 1000, height: 500 } : null) });
    expect([$.photo.width, $.photo.height]).to.deep.equal(["100%", "100%"]);

    readable = true;
    vm.notifyListeners();

    expect([$.photo.width, $.photo.height]).to.deep.equal([800, 400]);
  });

  it("reads the natural size once per photo, however often it re-fits", function () {
    let reads = 0;
    const $ = { photo: makeWidget({ width: null, height: null, image: null }) };
    const vm = new PhotoVM("/wide.jpg");
    bindView($, vm, { photo: { image: "image", size: fit("image", { width: 800, height: 400 }) } },
      { measureImage: (url) => { reads++; return NATURAL[url]; } });
    vm.notifyListeners();
    vm.notifyListeners();
    expect(reads).to.equal(1);
  });
});

// A stand-in for the box a collection hands its children — the shape fit()
// subscribes to.
function makeObservableBox(size) {
  const listeners = [];
  return {
    width: size.width,
    height: size.height,
    set(next) { this.width = next.width; this.height = next.height; listeners.slice().forEach((l) => l()); },
    addListener(l) { listeners.push(l); },
    removeListener(l) { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); },
  };
}

// Hiding a widget leaves its space behind, so a row of tools laid out in a flow
// keeps a gap where an absent one would have been — and anything centred against
// that row is measured off the gap. Presence is the other thing "not shown" can
// mean, and the one a toolbar wants.
describe("presence binding (present)", function () {
  const { present } = bindView;

  class ToolVM extends ChangeNotifier {
    constructor(shown) { super(); this._shown = shown; }
    get shown() { return this._shown; }
    set shown(v) { this._shown = v; this.notifyListeners(); }
  }

  function bind(shown) {
    const $ = { icon: makeWidget({ visible: null, width: "35dp", height: "20dp" }) };
    const vm = new ToolVM(shown);
    bindView($, vm, { icon: { visible: present("shown") } });
    return { $, vm };
  }

  it("leaves a present widget the size its style gave it", function () {
    const { $ } = bind(true);
    expect([$.icon.visible, $.icon.width, $.icon.height]).to.deep.equal([true, "35dp", "20dp"]);
  });

  it("takes back the space of a widget that is not present", function () {
    const { $ } = bind(false);
    expect([$.icon.visible, $.icon.width, $.icon.height]).to.deep.equal([false, 0, 0]);
  });

  it("gives the space back when the widget becomes present again", function () {
    const { $, vm } = bind(false);
    vm.shown = true;
    expect([$.icon.visible, $.icon.width, $.icon.height]).to.deep.equal([true, "35dp", "20dp"]);
  });
});

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

  // A ScrollableView takes its children through views/addView/removeView rather
  // than add/remove — the same shape of difference as the TableView's setData,
  // so the binding feature-detects it the same way and a paged surface is just
  // another container.
  function makePagedContainer() {
    const views = [];
    const listeners = {};
    return {
      views,
      addView(v) { views.push(v); },
      removeView(v) { const i = views.indexOf(v); if (i >= 0) views.splice(i, 1); },
      addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
      removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter((l) => l !== cb); },
      fireEvent(name, data) { (listeners[name] || []).slice().forEach((cb) => cb(data)); },
      ids() { return views.map((v) => v.id); },
    };
  }

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
          box: args.box,
          view: { id: args.rowVm.key },
          dispose() { disposed.push(args.rowVm.key); },
        };
        built.push(handle);
        return handle;
      };
      return { built, disposed, createComponent };
    }

    // A page cannot take its box from its own frame: it would be measuring the
    // surface it is about to resize inside, and feed its own next reading. The
    // measurement has to come from the container above it.
    it("hands each child the container's measured box", function () {
      const container = makePagedContainer();
      const { createComponent, built } = makeFactory();
      const vm = new ListVM([{ key: "a" }]);
      bindView({ pager: container }, vm, { pager: { views: collection("items", "Photo", "size") } }, { createComponent });
      container.size = { width: 800, height: 400 };
      container.fireEvent("postlayout");
      expect([built[0].box.width, built[0].box.height]).to.deep.equal([800, 400]);
    });

    // Titanium emits a postlayout before the frame has converged; a zero-sized
    // reading would collapse every child rather than size it.
    it("withholds a box read before the container frame has a size", function () {
      const container = makePagedContainer();
      const { createComponent, built } = makeFactory();
      const vm = new ListVM([{ key: "a" }]);
      bindView({ pager: container }, vm, { pager: { views: collection("items", "Photo", "size") } }, { createComponent });
      container.size = { width: 800, height: 0 };
      container.fireEvent("postlayout");
      expect([built[0].box.width, built[0].box.height]).to.deep.equal([0, 0]);
    });

    it("does not disturb its children when the container is measured at the same size again", function () {
      const container = makePagedContainer();
      const { createComponent, built } = makeFactory();
      const vm = new ListVM([{ key: "a" }]);
      bindView({ pager: container }, vm, { pager: { views: collection("items", "Photo", "size") } }, { createComponent });
      container.size = { width: 800, height: 400 };
      container.fireEvent("postlayout");
      let refits = 0;
      built[0].box.addListener(() => refits++);
      container.fireEvent("postlayout");
      expect(refits).to.equal(0);
    });

    it("keeps a child's box current when the container is measured again", function () {
      const container = makePagedContainer();
      const { createComponent, built } = makeFactory();
      const vm = new ListVM([{ key: "a" }]);
      bindView({ pager: container }, vm, { pager: { views: collection("items", "Photo", "size") } }, { createComponent });
      container.size = { width: 800, height: 400 };
      container.fireEvent("postlayout");
      container.size = { width: 400, height: 400 };
      container.fireEvent("postlayout");
      expect([built[0].box.width, built[0].box.height]).to.deep.equal([400, 400]);
    });

    it("mounts children into a container that only takes them through addView", function () {
      const container = makePagedContainer();
      const { createComponent } = makeFactory();
      const vm = new ListVM([{ key: "a" }, { key: "b" }]);
      bindView({ pager: container }, vm, { pager: { views: collection("items", "Photo") } }, { createComponent });
      expect(container.ids()).to.deep.equal(["a", "b"]);
    });

    it("removes a child from an addView container when its item goes", function () {
      const container = makePagedContainer();
      const { createComponent, disposed } = makeFactory();
      const vm = new ListVM([{ key: "a" }, { key: "b" }]);
      bindView({ pager: container }, vm, { pager: { views: collection("items", "Photo") } }, { createComponent });
      vm.items = [{ key: "b" }];
      expect(container.ids()).to.deep.equal(["b"]);
      expect(disposed).to.deep.equal(["a"]);
    });

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

    it("reconciles on notify: adds new, retains existing (not recreated), disposes removed", function () {
      const container = makeContainer();
      const { disposed, createComponent } = makeFactory();
      const vm = new ListVM([{ key: 1 }, { key: 2 }]);
      bindView({ list: container }, vm, {
        list: { children: collection("items", "MyRow") },
      }, { createComponent });
      const child2Before = container.children.find((c) => c.id === 2);

      vm.items = [{ key: 2 }, { key: 3 }]; // drop 1, keep 2, add 3

      expect(container.ids()).to.deep.equal([2, 3]);
      expect(disposed, "only the removed child is disposed").to.deep.equal([1]);
      expect(container.children.find((c) => c.id === 2), "retained child is not recreated")
        .to.equal(child2Before);
    });

    it("unbind disposes every child and stops reconciling", function () {
      const container = makeContainer();
      const { disposed, createComponent } = makeFactory();
      const vm = new ListVM([{ key: 1 }, { key: 2 }]);
      const unbind = bindView({ list: container }, vm, {
        list: { children: collection("items", "MyRow") },
      }, { createComponent });

      unbind();

      expect(disposed.slice().sort()).to.deep.equal([1, 2]);
      expect(container.children).to.deep.equal([]);
      vm.items = [{ key: 9 }]; // a notify after unbind must do nothing
      expect(container.children).to.deep.equal([]);
    });

    it("render-mode reuses retained rows across a reconcile", function () {
      const container = makeTableContainer();
      const { disposed, createComponent } = makeFactory();
      const vm = new ListVM([{ key: 1 }, { key: 2 }]);
      bindView({ table: container }, vm, {
        table: { children: collection("items", "MyRow") },
      }, { createComponent });
      const view2Before = container.data.find((v) => v.id === 2);

      vm.items = [{ key: 2 }, { key: 3 }]; // drop 1, keep 2, add 3

      expect(container.ids(), "order follows the VM list").to.deep.equal([2, 3]);
      expect(disposed, "only the removed row is disposed").to.deep.equal([1]);
      expect(container.data.find((v) => v.id === 2), "retained row is reused, not rebuilt")
        .to.equal(view2Before);
    });

    it("throws if no createComponent factory is supplied", function () {
      const container = makeTableContainer();
      const vm = new ListVM([{ key: 1 }]);
      expect(() => bindView({ table: container }, vm, {
        table: { children: collection("items", "MyRow") },
      })).to.throw(/createComponent/);
    });
  });

  // Polymorphic list: no component name is given, so each item names its own
  // component. The tray's slots use this — a slot is a SampleTaxaIcon or a
  // SampleTrayPlus depending on its kind.
  describe("polymorphic collection: collection(getter) with per-item component", function () {
    function makeFactory() {
      const built = [];
      const disposed = [];
      const createComponent = (name, args) => {
        const handle = {
          name, rowVm: args.rowVm, view: { id: args.rowVm.key },
          dispose() { disposed.push(args.rowVm.key); },
        };
        built.push(handle);
        return handle;
      };
      return { built, disposed, createComponent };
    }

    it("builds each child from its own item.component", function () {
      const container = makeContainer();
      const { built, createComponent } = makeFactory();
      const vm = new ListVM([
        { key: "0:SampleTaxaIcon", component: "SampleTaxaIcon" },
        { key: "1:SampleTrayPlus", component: "SampleTrayPlus" },
      ]);
      bindView({ list: container }, vm, {
        list: { children: collection("items") },
      }, { createComponent });
      expect(built.map((h) => h.name)).to.deep.equal(["SampleTaxaIcon", "SampleTrayPlus"]);
      expect(container.ids()).to.deep.equal(["0:SampleTaxaIcon", "1:SampleTrayPlus"]);
    });

    it("recreates a slot as a different component when its key changes", function () {
      const container = makeContainer();
      const { built, disposed, createComponent } = makeFactory();
      const vm = new ListVM([{ key: "0:SampleTrayPlus", component: "SampleTrayPlus" }]);
      bindView({ list: container }, vm, {
        list: { children: collection("items") },
      }, { createComponent });

      vm.items = [{ key: "0:SampleTaxaIcon", component: "SampleTaxaIcon" }]; // slot 0 becomes a taxon

      expect(disposed).to.deep.equal(["0:SampleTrayPlus"]);
      expect(built.map((h) => h.name)).to.deep.equal(["SampleTrayPlus", "SampleTaxaIcon"]);
      expect(container.ids()).to.deep.equal(["0:SampleTaxaIcon"]);
    });

    // The tray's slots are flow-laid, so container order must follow item order
    // even when a middle slot swaps component (which otherwise appends the new
    // child at the end).
    it("keeps container order matching item order when a middle slot swaps", function () {
      const container = makeContainer();
      const { createComponent } = makeFactory();
      const vm = new ListVM([
        { key: "0:SampleTaxaIcon", component: "SampleTaxaIcon" },
        { key: "1:SampleTaxaIcon", component: "SampleTaxaIcon" },
        { key: "2:SampleTrayPlus", component: "SampleTrayPlus" },
      ]);
      bindView({ list: container }, vm, {
        list: { children: collection("items") },
      }, { createComponent });

      // slot 1 becomes the add cell (its old taxon child is disposed, a plus built)
      vm.items = [
        { key: "0:SampleTaxaIcon", component: "SampleTaxaIcon" },
        { key: "1:SampleTrayPlus", component: "SampleTrayPlus" },
        { key: "2:SampleTrayPlus", component: "SampleTrayPlus" },
      ];

      expect(container.ids()).to.deep.equal([
        "0:SampleTaxaIcon", "1:SampleTrayPlus", "2:SampleTrayPlus",
      ]);
    });
  });

  // A single fixed nested component (the tray endcap) bound to a sub-VM — the
  // arity-1 sibling of collection, with no keyed diff.
  describe("single-component binding: component(getter, name)", function () {
    const { component } = bindView;

    function makeFactory() {
      const built = [];
      const disposed = [];
      const createComponent = (name, args) => {
        const handle = {
          name, rowVm: args.rowVm, view: { id: name },
          dispose() { disposed.push(name); },
        };
        built.push(handle);
        return handle;
      };
      return { built, disposed, createComponent };
    }

    function vmWithChild(child) {
      const vm = new ChangeNotifier();
      Object.defineProperty(vm, "endcapVm", { value: child, enumerable: true });
      return vm;
    }

    it("builds one child from the sub-VM getter, passes it as { rowVm }, and attaches it", function () {
      const container = makeContainer();
      const { built, createComponent } = makeFactory();
      const child = { key: "endcap" };
      bindView({ pane: container }, vmWithChild(child), {
        pane: { slot: component("endcapVm", "SampleTrayEndcap") },
      }, { createComponent });
      expect(built.map((h) => h.name)).to.deep.equal(["SampleTrayEndcap"]);
      expect(built[0].rowVm).to.equal(child);
      expect(container.ids()).to.deep.equal(["SampleTrayEndcap"]);
    });

    it("disposes and detaches the child on unbind", function () {
      const container = makeContainer();
      const { disposed, createComponent } = makeFactory();
      const unbind = bindView({ pane: container }, vmWithChild({ key: "endcap" }), {
        pane: { slot: component("endcapVm", "SampleTrayEndcap") },
      }, { createComponent });

      unbind();

      expect(disposed).to.deep.equal(["SampleTrayEndcap"]);
      expect(container.children).to.deep.equal([]);
    });

    it("throws when the component getter is missing on the VM", function () {
      const container = makeContainer();
      const { createComponent } = makeFactory();
      expect(() => bindView({ pane: container }, new ChangeNotifier(), {
        pane: { slot: component("endcapVm", "SampleTrayEndcap") },
      }, { createComponent })).to.throw(/endcapVm/);
    });

    it("throws if no createComponent factory is supplied", function () {
      const container = makeContainer();
      expect(() => bindView({ pane: container }, vmWithChild({ key: "endcap" }), {
        pane: { slot: component("endcapVm", "SampleTrayEndcap") },
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

    // Every marker, not a hand-picked few: a controller destructures its markers
    // off the pre-bound binder, so one the seam forgets to carry is undefined at
    // the call site and the screen fails to build.
    it("carries every marker the module exports", function () {
      const bind = bindView.makeBinder(() => {});
      const markers = Object.keys(bindView).filter(k => k !== "makeBinder");
      expect(markers).to.not.be.empty;
      markers.forEach(name =>
        expect(typeof bind[name], `binder is missing the ${name} marker`).to.equal("function"));
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
