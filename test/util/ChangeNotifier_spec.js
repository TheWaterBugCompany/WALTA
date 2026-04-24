require("mocha");
const { expect } = require("chai");
const ChangeNotifier = require("../../walta-app/app/lib/util/ChangeNotifier");

describe("ChangeNotifier", function () {
  let notifier;

  beforeEach(function () {
    notifier = new ChangeNotifier();
  });

  it("calls registered listeners with no arguments on notifyListeners()", function () {
    let calls = 0;
    let arg;
    notifier.addListener((...args) => { calls++; arg = args; });
    notifier.notifyListeners();
    expect(calls).to.equal(1);
    expect(arg).to.deep.equal([]);
  });

  it("invokes every listener in the order they were added", function () {
    const order = [];
    notifier.addListener(() => order.push("a"));
    notifier.addListener(() => order.push("b"));
    notifier.addListener(() => order.push("c"));
    notifier.notifyListeners();
    expect(order).to.deep.equal(["a", "b", "c"]);
  });

  it("removeListener(cb) stops further notifications for that callback", function () {
    let aCalls = 0, bCalls = 0;
    const a = () => aCalls++;
    const b = () => bCalls++;
    notifier.addListener(a);
    notifier.addListener(b);
    notifier.notifyListeners();
    notifier.removeListener(a);
    notifier.notifyListeners();
    expect(aCalls).to.equal(1);
    expect(bCalls).to.equal(2);
  });

  it("removeListener is a no-op for a callback that isn't registered", function () {
    expect(() => notifier.removeListener(() => {})).to.not.throw();
  });

  it("dispose() removes all listeners", function () {
    let calls = 0;
    notifier.addListener(() => calls++);
    notifier.addListener(() => calls++);
    notifier.dispose();
    notifier.notifyListeners();
    expect(calls).to.equal(0);
  });

  it("supports the same callback registered twice (idempotent add is explicit via removeListener)", function () {
    let calls = 0;
    const cb = () => calls++;
    notifier.addListener(cb);
    notifier.addListener(cb);
    notifier.notifyListeners();
    expect(calls).to.equal(2);
    // removeListener removes all matching callbacks (simplest-common-case semantics)
    notifier.removeListener(cb);
    notifier.notifyListeners();
    expect(calls).to.equal(2);
  });

  describe("named events (on/off/trigger)", function () {
    it("on(event, cb) fires on trigger(event)", function () {
      let calls = 0;
      notifier.on("close", () => calls++);
      notifier.trigger("close");
      expect(calls).to.equal(1);
    });

    it("passes data through trigger(event, data) to the callback", function () {
      let received;
      notifier.on("update", x => { received = x; });
      notifier.trigger("update", { value: 42 });
      expect(received).to.deep.equal({ value: 42 });
    });

    it("different event names are independent", function () {
      const seen = [];
      notifier.on("a", () => seen.push("a"));
      notifier.on("b", () => seen.push("b"));
      notifier.trigger("a");
      notifier.trigger("b");
      notifier.trigger("a");
      expect(seen).to.deep.equal(["a", "b", "a"]);
    });

    it("off(event, cb) stops further calls to that handler", function () {
      let calls = 0;
      const cb = () => calls++;
      notifier.on("close", cb);
      notifier.trigger("close");
      notifier.off("close", cb);
      notifier.trigger("close");
      expect(calls).to.equal(1);
    });

    it("trigger on an unknown event is a no-op", function () {
      expect(() => notifier.trigger("nobody-listens")).to.not.throw();
    });

    it("off for an unknown event or handler is a no-op", function () {
      expect(() => notifier.off("never-registered", () => {})).to.not.throw();
    });

    it("dispose() clears named-event listeners too", function () {
      let calls = 0;
      notifier.on("close", () => calls++);
      notifier.dispose();
      notifier.trigger("close");
      expect(calls).to.equal(0);
    });

    it("named-event listeners and change listeners are independent", function () {
      let changes = 0, closes = 0;
      notifier.addListener(() => changes++);
      notifier.on("close", () => closes++);
      notifier.notifyListeners();
      notifier.trigger("close");
      expect(changes).to.equal(1);
      expect(closes).to.equal(1);
    });
  });
});
