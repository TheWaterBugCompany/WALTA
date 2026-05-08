require("mocha");
const { expect } = require("chai");

describe("SqlSink", function () {
    let SqlSink;

    beforeEach(function () {
        delete require.cache[require.resolve("../../../walta-app/app/lib/util/sinks/SqlSink")];
        SqlSink = require("../../../walta-app/app/lib/util/sinks/SqlSink");
    });

    function fakeRepo() {
        const appended = [];
        return { appended, append(entry) { appended.push(entry); } };
    }

    it("create() returns a sink with levels [trace, info, warn, error] (skips debug)", function () {
        const sink = SqlSink.create(fakeRepo());
        expect(sink.levels).to.deep.equal(["trace", "info", "warn", "error"]);
    });

    it("write() forwards the entry to repo.append and returns a Promise", async function () {
        const repo = fakeRepo();
        const sink = SqlSink.create(repo);
        const result = sink.write({ ts: 1, level: "info", facility: "sync", message: "uploaded" });
        expect(result).to.be.an.instanceof(Promise);
        await result;
        expect(repo.appended).to.deep.equal([
            { ts: 1, level: "info", facility: "sync", message: "uploaded" }
        ]);
    });

    it("write() rejects if repo.append throws (sync errors become async rejections)", async function () {
        const sink = SqlSink.create({ append() { throw new Error("disk full"); } });
        let caught;
        try { await sink.write({ ts: 1, level: "info", facility: "x", message: "m" }); }
        catch (e) { caught = e; }
        expect(caught).to.be.an.instanceof(Error);
        expect(caught.message).to.equal("disk full");
    });
});
