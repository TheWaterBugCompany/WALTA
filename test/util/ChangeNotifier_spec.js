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
});
