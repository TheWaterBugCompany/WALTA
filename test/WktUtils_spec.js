require("mocha");

const { expect } = require("chai");
const WktUtils = require("util/WktUtils");

describe("WktUtils", function() {
    describe("makeArc", function() {
        it("should create an arc", function() {
            const result = WktUtils.makeArc(0,45,10);
            expect(result).to.match(/^POLYGON\(\(0 0,/);
            expect(result).to.match(/7\.0710678118654755 7\.071067811865475\)\)$/);
            // 7 coordinate pairs: origin + 6 arc points
            expect(result.split(",").length).to.equal(7);
        });
    });
});