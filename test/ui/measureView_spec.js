require("mocha");
const { expect } = require("chai");
const measureView = require("../../walta-app/app/lib/ui/measureView");

function makeView() {
  const listeners = {};
  return {
    size: { width: 0, height: 0 },
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) {
      listeners[name] = (listeners[name] || []).filter(l => l !== cb);
    },
    fireEvent(name) { (listeners[name] || []).forEach(cb => cb()); },
    listenerCount(name) { return (listeners[name] || []).length; },
  };
}

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

describe("measureView", function () {
  let view;
  beforeEach(function () { view = makeView(); });

  it("hands the size to onSize once, synchronously, when the first reading is usable", function () {
    view.size = { width: 10, height: 20 };
    const sizes = [];
    measureView(view, s => sizes.push(s));
    view.fireEvent("postlayout");
    expect(sizes).to.deep.equal([{ width: 10, height: 20 }]);
  });

  it("retries until the reading is usable (Titanium's premature postlayout)", async function () {
    view.size = { width: 10, height: 0 }; // not laid out yet
    let got = null;
    measureView(view, s => { got = s; });
    view.fireEvent("postlayout");
    view.size = { width: 10, height: 20 }; // becomes ready after the event
    await eventually(() => expect(got).to.deep.equal({ width: 10, height: 20 }));
  });

  it("tolerates a throwing read and keeps polling", async function () {
    let ready = false;
    Object.defineProperty(view, "size", {
      get() { if (!ready) throw new Error("activity detached"); return { width: 10, height: 20 }; },
      configurable: true,
    });
    let got = null;
    measureView(view, s => { got = s; });
    view.fireEvent("postlayout");
    ready = true;
    await eventually(() => expect(got).to.deep.equal({ width: 10, height: 20 }));
  });

  it("stop() cancels a pending retry and detaches the event", async function () {
    view.size = { width: 10, height: 0 };
    let calls = 0;
    const stop = measureView(view, () => { calls++; });
    view.fireEvent("postlayout");
    stop();
    view.size = { width: 10, height: 20 };
    await new Promise(r => setTimeout(r, 250));
    expect(calls, "onSize never fired after stop").to.equal(0);
    expect(view.listenerCount("postlayout"), "postlayout listener detached").to.equal(0);
  });
});
