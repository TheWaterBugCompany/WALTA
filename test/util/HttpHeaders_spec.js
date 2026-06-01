require("mocha");
const { expect } = require("chai");
const { HttpHeaders } = require("../../walta-app/app/lib/util/HttpHeaders");

describe("HttpHeaders", function () {
    describe("parse()", function () {
        it("parses CRLF-separated 'Name: value' lines", function () {
            const h = HttpHeaders.parse("Content-Type: application/json\r\nX-RateLimit-Remaining: 57");
            expect(h.get("Content-Type")).to.equal("application/json");
            expect(h.get("X-RateLimit-Remaining")).to.equal("57");
            expect(h.size).to.equal(2);
        });

        it("tolerates LF-only line endings", function () {
            const h = HttpHeaders.parse("Content-Type: text/plain\nDate: now");
            expect(h.get("Content-Type")).to.equal("text/plain");
            expect(h.get("Date")).to.equal("now");
        });

        it("returns an empty HttpHeaders for an empty or missing raw string", function () {
            expect(HttpHeaders.parse("").size).to.equal(0);
            expect(HttpHeaders.parse(null).size).to.equal(0);
            expect(HttpHeaders.parse(undefined).size).to.equal(0);
        });

        it("skips blank lines and lines without a colon", function () {
            const h = HttpHeaders.parse("Content-Type: application/json\r\n\r\nGarbageNoColon\r\nDate: now");
            expect(h.size).to.equal(2);
            expect(h.get("Content-Type")).to.equal("application/json");
            expect(h.get("Date")).to.equal("now");
        });

        it("trims surrounding whitespace from names and values", function () {
            const h = HttpHeaders.parse("  Content-Type  :   application/json   ");
            expect(h.get("Content-Type")).to.equal("application/json");
        });
    });

    describe("get()", function () {
        it("is case-insensitive", function () {
            const h = HttpHeaders.parse("X-RateLimit-Remaining: 57");
            expect(h.get("x-ratelimit-remaining")).to.equal("57");
            expect(h.get("X-RATELIMIT-REMAINING")).to.equal("57");
            expect(h.get("X-RateLimit-Remaining")).to.equal("57");
        });

        it("returns undefined for missing headers", function () {
            const h = HttpHeaders.parse("Content-Type: application/json");
            expect(h.get("Retry-After")).to.equal(undefined);
        });
    });

    describe("entries()", function () {
        it("yields names in lowercase canonical form", function () {
            const h = HttpHeaders.parse("Content-Type: application/json\r\nX-RateLimit-Remaining: 57");
            const out = {};
            for (const [name, value] of h.entries()) out[name] = value;
            expect(out).to.deep.equal({
                "content-type": "application/json",
                "x-ratelimit-remaining": "57",
            });
        });
    });
});
