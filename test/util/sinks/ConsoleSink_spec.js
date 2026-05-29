require("mocha");
const { expect } = require("chai");
const {
    installFakeTi,
    uninstallFakeTi,
    makeCapturingTiAPI,
    makeCapturingConsole,
} = require("../../fixtures/tiFakes");

describe("ConsoleSink", function () {
    let ConsoleSink;

    beforeEach(function () {
        delete require.cache[require.resolve("../../../walta-app/app/lib/util/sinks/ConsoleSink")];
        ConsoleSink = require("../../../walta-app/app/lib/util/sinks/ConsoleSink");
    });

    afterEach(uninstallFakeTi);

    it("write() returns a Promise", function () {
        installFakeTi({ api: makeCapturingTiAPI().api });
        const result = ConsoleSink.write({ ts: 0, level: "trace", facility: "x", message: "hi" });
        expect(result).to.be.an.instanceof(Promise);
    });

    describe("with Ti.API present", function () {
        let tiCalls;
        beforeEach(function () {
            const captured = makeCapturingTiAPI();
            tiCalls = captured.calls;
            installFakeTi({ api: captured.api });
        });

        it("routes trace to Ti.API.debug", async function () {
            await ConsoleSink.write({ level: "trace", message: "t" });
            expect(tiCalls).to.deep.equal([{ method: "debug", m: "t" }]);
        });

        it("routes debug to Ti.API.debug", async function () {
            await ConsoleSink.write({ level: "debug", message: "d" });
            expect(tiCalls).to.deep.equal([{ method: "debug", m: "d" }]);
        });

        it("routes info to Ti.API.info", async function () {
            await ConsoleSink.write({ level: "info", message: "i" });
            expect(tiCalls).to.deep.equal([{ method: "info", m: "i" }]);
        });

        it("routes warn to Ti.API.warn", async function () {
            await ConsoleSink.write({ level: "warn", message: "w" });
            expect(tiCalls).to.deep.equal([{ method: "warn", m: "w" }]);
        });

        it("routes error to Ti.API.error", async function () {
            await ConsoleSink.write({ level: "error", message: "e" });
            expect(tiCalls).to.deep.equal([{ method: "error", m: "e" }]);
        });
    });

    describe("without Ti.API (Node fallback)", function () {
        let cap;
        beforeEach(function () { cap = makeCapturingConsole(); });
        afterEach(function () { cap.restore(); });

        it("routes trace and debug to console.log", async function () {
            await ConsoleSink.write({ level: "trace", message: "t" });
            await ConsoleSink.write({ level: "debug", message: "d" });
            expect(cap.calls).to.deep.equal([
                { method: "log", m: "t" },
                { method: "log", m: "d" }
            ]);
        });

        it("routes info to console.info, warn to console.warn, error to console.error", async function () {
            await ConsoleSink.write({ level: "info",  message: "i" });
            await ConsoleSink.write({ level: "warn",  message: "w" });
            await ConsoleSink.write({ level: "error", message: "e" });
            expect(cap.calls).to.deep.equal([
                { method: "info",  m: "i" },
                { method: "warn",  m: "w" },
                { method: "error", m: "e" }
            ]);
        });
    });
});
