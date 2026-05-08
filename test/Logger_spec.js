require("mocha");
const { expect } = require("chai");

// see docs/patterns/logger-sinks.md
describe("Logger sink dispatch", function () {
    let Logger;

    beforeEach(function () {
        delete require.cache[require.resolve("../walta-app/app/lib/util/Logger")];
        Logger = require("../walta-app/app/lib/util/Logger");
    });

    function captureSink() {
        const entries = [];
        return { entries, write(entry) { entries.push(entry); return Promise.resolve(); } };
    }

    // Yield long enough for the microtask queue to drain fully, including
    // microtasks queued by other microtasks. `await Promise.resolve()` only
    // flushes one level — `setImmediate` schedules a macrotask, and microtasks
    // are fully drained between macrotasks.
    function flushMicroTasks() {
        return new Promise(r => setImmediate(r));
    }

    it("forwards Logger.log() entries to a registered sink", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.log("hello");
        await flushMicroTasks();
        expect(sink.entries).to.have.length(1);
        expect(sink.entries[0]).to.include({ level: "trace", message: "hello" });
    });

    it("forwards Logger.warn() with level 'warn'", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.warn("careful");
        await flushMicroTasks();
        expect(sink.entries[0]).to.include({ level: "warn", message: "careful" });
    });

    it("forwards Logger.error() with level 'error'", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.error("boom");
        await flushMicroTasks();
        expect(sink.entries[0]).to.include({ level: "error", message: "boom" });
    });

    it("forwards Logger.debug() with level 'debug'", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.debug("trace me");
        await flushMicroTasks();
        expect(sink.entries[0]).to.include({ level: "debug", message: "trace me" });
    });

    it("forwards Logger.info() with level 'info'", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.info("starting sync");
        await flushMicroTasks();
        expect(sink.entries[0]).to.include({ level: "info", message: "starting sync" });
    });

    it("includes the tag argument as 'facility' on the entry", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.log("upload finished", "sync");
        await flushMicroTasks();
        expect(sink.entries[0]).to.include({ level: "trace", facility: "sync", message: "upload finished" });
    });

    it("includes a numeric millisecond timestamp on each entry", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        const before = Date.now();
        Logger.log("hello");
        const after = Date.now();
        await flushMicroTasks();
        expect(sink.entries[0].ts).to.be.a("number");
        expect(sink.entries[0].ts).to.be.at.least(before);
        expect(sink.entries[0].ts).to.be.at.most(after);
    });

    it("forwards only matching levels to a sink with a level allowlist", async function () {
        const sink = captureSink();
        sink.levels = ["warn"];
        Logger.addSink(sink);
        Logger.log("trace msg");
        Logger.warn("warn msg");
        Logger.error("error msg");
        await flushMicroTasks();
        expect(sink.entries).to.have.length(1);
        expect(sink.entries[0]).to.include({ level: "warn", message: "warn msg" });
    });

    it("recordException routes through the sink dispatcher as an error entry", async function () {
        const sink = captureSink();
        Logger.addSink(sink);
        Logger.recordException(new Error("boom"));
        await flushMicroTasks();
        expect(sink.entries).to.have.length(1);
        expect(sink.entries[0]).to.include({ level: "error", facility: "exception" });
        expect(sink.entries[0].message).to.match(/boom/);
    });

    it("falls back to Ti.API.log when a sink's write() rejects", async function () {
        const fallbackCalls = [];
        global.Ti = {
            API: {
                log(level, message) { fallbackCalls.push({ level, message }); },
                debug() {}, info() {}, warn() {}, error() {}
            }
        };
        try {
            Logger.addSink({ write() { return Promise.reject(new Error("disk full")); } });
            expect(() => Logger.log("hello")).to.not.throw();
            await flushMicroTasks();
            expect(fallbackCalls).to.have.length(1);
            expect(fallbackCalls[0].level).to.equal("trace");
            expect(fallbackCalls[0].message).to.match(/disk full/);
            expect(fallbackCalls[0].message).to.match(/hello/);
        } finally {
            delete global.Ti;
        }
    });
});

describe("Logger.subscribe", function () {
    let Logger;

    beforeEach(function () {
        delete require.cache[require.resolve("../walta-app/app/lib/util/Logger")];
        Logger = require("../walta-app/app/lib/util/Logger");
    });

    it("delivers entries that match both facility and minLevel", function () {
        const captured = [];
        Logger.subscribe({ facility: "sync", minLevel: "info" }, e => captured.push(e));
        Logger.info("uploaded", "sync");
        expect(captured).to.have.length(1);
        expect(captured[0]).to.include({ level: "info", facility: "sync", message: "uploaded" });
    });

    it("filters out entries from a different facility", function () {
        const captured = [];
        Logger.subscribe({ facility: "sync", minLevel: "info" }, e => captured.push(e));
        Logger.info("auth ok", "auth");
        expect(captured).to.have.length(0);
    });

    it("filters out entries below minLevel (debug < trace < info < warn < error)", function () {
        const captured = [];
        Logger.subscribe({ facility: "sync", minLevel: "info" }, e => captured.push(e));
        Logger.debug("noise", "sync");
        Logger.log("trace bit", "sync");
        Logger.info("milestone", "sync");
        Logger.warn("slow", "sync");
        Logger.error("boom", "sync");
        expect(captured.map(e => e.level)).to.deep.equal(["info", "warn", "error"]);
    });

    it("returns an unsubscribe function that stops further notifications", function () {
        const captured = [];
        const unsubscribe = Logger.subscribe({ facility: "sync", minLevel: "info" }, e => captured.push(e));
        Logger.info("first", "sync");
        unsubscribe();
        Logger.info("second", "sync");
        expect(captured.map(e => e.message)).to.deep.equal(["first"]);
    });

    it("isolates a throwing subscriber so other subscribers still fire", function () {
        const captured = [];
        Logger.subscribe({ facility: "sync", minLevel: "info" }, () => { throw new Error("nope"); });
        Logger.subscribe({ facility: "sync", minLevel: "info" }, e => captured.push(e));
        expect(() => Logger.info("hello", "sync")).to.not.throw();
        expect(captured).to.have.length(1);
    });
});

describe("Logger.configure", function () {
    let Logger;

    beforeEach(function () {
        delete require.cache[require.resolve("../walta-app/app/lib/util/Logger")];
        delete require.cache[require.resolve("../walta-app/app/lib/util/sinks/ConsoleSink")];
        Logger = require("../walta-app/app/lib/util/Logger");
    });

    function flushMicroTasks() {
        return new Promise(r => setImmediate(r));
    }

    function fakeTi() {
        const calls = [];
        global.Ti = {
            API: {
                debug(m) { calls.push({ method: "debug", m }); },
                info(m)  { calls.push({ method: "info",  m }); },
                warn(m)  { calls.push({ method: "warn",  m }); },
                error(m) { calls.push({ method: "error", m }); },
                log() {}
            }
        };
        return calls;
    }

    afterEach(function () { delete global.Ti; });

    it("does not route Logger.log() to Ti.API before configure() registers ConsoleSink", async function () {
        const tiCalls = fakeTi();
        Logger.log("hello");
        await flushMicroTasks();
        expect(tiCalls).to.have.length(0);
    });

    it("routes Logger entries to Ti.API exactly once after configure()", async function () {
        const tiCalls = fakeTi();
        Logger.configure();
        Logger.log("trace msg");
        Logger.warn("warn msg");
        Logger.error("error msg");
        await flushMicroTasks();
        expect(tiCalls).to.deep.equal([
            { method: "debug", m: "trace msg" },
            { method: "warn",  m: "warn msg" },
            { method: "error", m: "error msg" }
        ]);
    });
});
