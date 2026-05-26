require("mocha");
const { expect } = require("chai");

// Dev-only WB-118 repro aid: hold a buffer to consume RAM and induce iOS
// memory warnings on devices with more headroom than the crashing 3 GB iPad.
const MemoryBallast = require("../../walta-app/app/lib/util/MemoryBallast");

describe("MemoryBallast", function () {
    afterEach(function () { MemoryBallast.deflate(); });

    it("holds the requested number of mebibytes", function () {
        const held = MemoryBallast.inflate(8);
        expect(held).to.equal(8 * 1024 * 1024);
        expect(MemoryBallast.heldBytes()).to.equal(8 * 1024 * 1024);
    });

    it("holds nothing for a zero or negative request", function () {
        expect(MemoryBallast.inflate(0)).to.equal(0);
        expect(MemoryBallast.heldBytes()).to.equal(0);
        expect(MemoryBallast.inflate(-5)).to.equal(0);
        expect(MemoryBallast.heldBytes()).to.equal(0);
    });

    it("releases what it holds on deflate()", function () {
        MemoryBallast.inflate(4);
        MemoryBallast.deflate();
        expect(MemoryBallast.heldBytes()).to.equal(0);
    });
});
