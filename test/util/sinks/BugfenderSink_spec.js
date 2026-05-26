require("mocha");
const { expect } = require("chai");

describe("BugfenderSink", function () {
    let BugfenderSink;
    let bfCalls;
    let fakeBugfender;

    beforeEach(function () {
        delete require.cache[require.resolve("../../../walta-app/app/lib/util/sinks/BugfenderSink")];
        BugfenderSink = require("../../../walta-app/app/lib/util/sinks/BugfenderSink");
        bfCalls = [];
        fakeBugfender = {
            d(arg) { bfCalls.push({ method: "d", arg }); },
            t(arg) { bfCalls.push({ method: "t", arg }); },
            i(arg) { bfCalls.push({ method: "i", arg }); },
            w(arg) { bfCalls.push({ method: "w", arg }); },
            e(arg) { bfCalls.push({ method: "e", arg }); }
        };
    });

    it("create() returns a sink that lets trace/debug/info/warn/error through", function () {
        const sink = BugfenderSink.create(fakeBugfender);
        expect(sink.levels).to.deep.equal(["trace", "debug", "info", "warn", "error"]);
    });

    it("write() returns a Promise", function () {
        const sink = BugfenderSink.create(fakeBugfender);
        const result = sink.write({ level: "trace", facility: "x", message: "m" });
        expect(result).to.be.an.instanceof(Promise);
    });

    it("routes trace to Bugfender.t with facility as tag", async function () {
        const sink = BugfenderSink.create(fakeBugfender);
        await sink.write({ level: "trace", facility: "sync", message: "uploaded" });
        expect(bfCalls).to.deep.equal([{ method: "t", arg: { tag: "sync", message: "uploaded" } }]);
    });

    it("routes info to Bugfender.i with facility as tag", async function () {
        const sink = BugfenderSink.create(fakeBugfender);
        await sink.write({ level: "info", facility: "sync", message: "Sync finished successfully" });
        expect(bfCalls).to.deep.equal([{ method: "i", arg: { tag: "sync", message: "Sync finished successfully" } }]);
    });

    it("routes warn to Bugfender.w with facility as tag", async function () {
        const sink = BugfenderSink.create(fakeBugfender);
        await sink.write({ level: "warn", facility: "auth", message: "token expired" });
        expect(bfCalls).to.deep.equal([{ method: "w", arg: { tag: "auth", message: "token expired" } }]);
    });

    it("routes error to Bugfender.e with facility as tag", async function () {
        const sink = BugfenderSink.create(fakeBugfender);
        await sink.write({ level: "error", facility: "key-loader", message: "parse failed" });
        expect(bfCalls).to.deep.equal([{ method: "e", arg: { tag: "key-loader", message: "parse failed" } }]);
    });

    it("write() is a no-op when create() received a null Bugfender", async function () {
        const sink = BugfenderSink.create(null);
        await sink.write({ level: "trace", facility: "x", message: "m" });
        await sink.write({ level: "info",  facility: "x", message: "m" });
        await sink.write({ level: "warn",  facility: "x", message: "m" });
        await sink.write({ level: "error", facility: "x", message: "m" });
        expect(bfCalls).to.have.length(0);
    });

    it("routes debug to Bugfender.d with facility as tag", async function () {
        const sink = BugfenderSink.create(fakeBugfender);
        await sink.write({ level: "debug", facility: "sync", message: "needsUpdate: remote newer" });
        expect(bfCalls).to.deep.equal([{ method: "d", arg: { tag: "sync", message: "needsUpdate: remote newer" } }]);
    });
});
