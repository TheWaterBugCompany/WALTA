require("mocha");
const { expect } = require("chai");

describe("ConsoleSink", function () {
    let ConsoleSink;
    let tiCalls;
    let consoleCalls;

    beforeEach(function () {
        delete require.cache[require.resolve("../../../walta-app/app/lib/util/sinks/ConsoleSink")];
        ConsoleSink = require("../../../walta-app/app/lib/util/sinks/ConsoleSink");
        tiCalls = [];
        consoleCalls = [];
    });

    afterEach(function () {
        delete global.Ti;
    });

    function fakeTi() {
        global.Ti = {
            API: {
                debug(m) { tiCalls.push({ method: "debug", m }); },
                info(m)  { tiCalls.push({ method: "info",  m }); },
                warn(m)  { tiCalls.push({ method: "warn",  m }); },
                error(m) { tiCalls.push({ method: "error", m }); }
            }
        };
    }

    function fakeConsole() {
        const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
        console.log = function (m) { consoleCalls.push({ method: "log", m }); };
        console.info = function (m) { consoleCalls.push({ method: "info", m }); };
        console.warn = function (m) { consoleCalls.push({ method: "warn", m }); };
        console.error = function (m) { consoleCalls.push({ method: "error", m }); };
        return function restore() {
            console.log = orig.log;
            console.info = orig.info;
            console.warn = orig.warn;
            console.error = orig.error;
        };
    }

    it("write() returns a Promise", function () {
        fakeTi();
        const result = ConsoleSink.write({ ts: 0, level: "trace", facility: "x", message: "hi" });
        expect(result).to.be.an.instanceof(Promise);
    });

    describe("with Ti.API present", function () {
        beforeEach(fakeTi);

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
        let restoreConsole;
        beforeEach(function () { restoreConsole = fakeConsole(); });
        afterEach(function () { restoreConsole(); });

        it("routes trace and debug to console.log", async function () {
            await ConsoleSink.write({ level: "trace", message: "t" });
            await ConsoleSink.write({ level: "debug", message: "d" });
            expect(consoleCalls).to.deep.equal([
                { method: "log", m: "t" },
                { method: "log", m: "d" }
            ]);
        });

        it("routes info to console.info, warn to console.warn, error to console.error", async function () {
            await ConsoleSink.write({ level: "info",  message: "i" });
            await ConsoleSink.write({ level: "warn",  message: "w" });
            await ConsoleSink.write({ level: "error", message: "e" });
            expect(consoleCalls).to.deep.equal([
                { method: "info",  m: "i" },
                { method: "warn",  m: "w" },
                { method: "error", m: "e" }
            ]);
        });
    });
});
