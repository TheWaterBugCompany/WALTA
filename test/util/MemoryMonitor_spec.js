require("mocha");
const { expect } = require("chai");

// MemoryMonitor logs iOS memory warnings at warn level so they reach Bugfender —
// the suspected trigger for the WB-118 proxy-purge crash family. Socialised test:
// real Logger + a capturing subscriber; only Ti.App (the IO boundary) is faked.
const Logger = require("../../walta-app/app/lib/util/Logger");
const MemoryMonitor = require("../../walta-app/app/lib/util/MemoryMonitor");

describe("MemoryMonitor", function () {
    function fakeApp() {
        const listeners = {};
        return {
            addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
            removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(f => f !== cb); },
            fire(name) { (listeners[name] || []).slice().forEach(f => f()); }
        };
    }

    let captured, unsubscribe;
    beforeEach(function () {
        captured = [];
        unsubscribe = Logger.subscribe({ facility: "memory" }, e => captured.push(e));
    });
    afterEach(function () { unsubscribe(); });

    it("logs a warn-level 'memory' breadcrumb when iOS fires a memorywarning", function () {
        const app = fakeApp();
        const dispose = MemoryMonitor.start(app);
        app.fire("memorywarning");
        dispose();
        expect(captured).to.have.length(1);
        expect(captured[0]).to.include({ level: "warn", facility: "memory" });
    });

    it("stops logging after dispose()", function () {
        const app = fakeApp();
        const dispose = MemoryMonitor.start(app);
        dispose();
        app.fire("memorywarning");
        expect(captured).to.have.length(0);
    });
});
