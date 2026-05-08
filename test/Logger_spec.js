require("mocha");
const { expect } = require("chai");

// Logger keeps a small in-memory ring buffer of recent log lines so the
// SyncFeedback "Show Logs" popup pane has something to show. Bugfender
// remains the long-term sink — this buffer is just for in-app visibility.
// See WB-45.

describe("Logger ring buffer", function () {
    let Logger;

    beforeEach(function () {
        // Fresh Logger module per test so the buffer starts empty.
        delete require.cache[require.resolve("../walta-app/app/lib/util/Logger")];
        Logger = require("../walta-app/app/lib/util/Logger");
    });

    describe("getLogLines()", function () {
        it("starts empty", function () {
            expect(Logger.getLogLines()).to.deep.equal([]);
        });

        it("returns a snapshot copy — mutating it does not affect the buffer", function () {
            Logger.log("first");
            const snapshot = Logger.getLogLines();
            snapshot.push("tampered");
            expect(Logger.getLogLines()).to.deep.equal(["[trace] first"]);
        });
    });

    describe("appending entries", function () {
        it("captures Logger.log() with a [trace] prefix", function () {
            Logger.log("hello");
            expect(Logger.getLogLines()).to.deep.equal(["[trace] hello"]);
        });

        it("captures Logger.warn() with a [warn] prefix", function () {
            Logger.warn("careful");
            expect(Logger.getLogLines()).to.deep.equal(["[warn] careful"]);
        });

        it("captures Logger.error() with an [error] prefix", function () {
            Logger.error("boom");
            expect(Logger.getLogLines()).to.deep.equal(["[error] boom"]);
        });

        it("uses the supplied tag in the prefix when provided", function () {
            Logger.log("upload finished", "sync");
            Logger.warn("retry", "sync");
            expect(Logger.getLogLines()).to.deep.equal(["[sync] upload finished", "[sync] retry"]);
        });

        it("keeps entries in insertion order across mixed calls", function () {
            Logger.log("a");
            Logger.warn("b");
            Logger.error("c");
            expect(Logger.getLogLines()).to.deep.equal(["[trace] a", "[warn] b", "[error] c"]);
        });
    });

    describe("ring buffer cap", function () {
        it("retains only the most recent 200 entries (LOG_CAP)", function () {
            for (let i = 0; i < 250; i++) Logger.log("msg " + i);
            const lines = Logger.getLogLines();
            expect(lines.length).to.equal(200);
            // Oldest 50 dropped — first kept entry is msg 50.
            expect(lines[0]).to.equal("[trace] msg 50");
            expect(lines[lines.length - 1]).to.equal("[trace] msg 249");
        });
    });

    describe("clearLog()", function () {
        it("empties the buffer", function () {
            Logger.log("temp");
            Logger.clearLog();
            expect(Logger.getLogLines()).to.deep.equal([]);
        });
    });

    describe("addListener() / removeListener()", function () {
        it("notifies listeners on each log/warn/error call", function () {
            const seen = [];
            Logger.addListener(() => seen.push(Logger.getLogLines().length));
            Logger.log("a");
            Logger.warn("b");
            Logger.error("c");
            expect(seen).to.deep.equal([1, 2, 3]);
        });

        it("notifies after the line is appended (so listeners see the new entry)", function () {
            let observedLast;
            Logger.addListener(() => {
                const lines = Logger.getLogLines();
                observedLast = lines[lines.length - 1];
            });
            Logger.log("hello");
            expect(observedLast).to.equal("[trace] hello");
        });

        it("stops notifying after removeListener()", function () {
            let calls = 0;
            const cb = () => { calls += 1; };
            Logger.addListener(cb);
            Logger.log("first");
            Logger.removeListener(cb);
            Logger.log("second");
            expect(calls).to.equal(1);
        });

        it("supports multiple independent listeners", function () {
            const seenA = [];
            const seenB = [];
            Logger.addListener(() => seenA.push(1));
            Logger.addListener(() => seenB.push(1));
            Logger.log("x");
            expect(seenA).to.deep.equal([1]);
            expect(seenB).to.deep.equal([1]);
        });
    });
});

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
