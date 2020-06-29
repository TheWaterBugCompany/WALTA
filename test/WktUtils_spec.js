require("mocha");

const { expect } = require("chai");
const WktUtils = require("util/WktUtils");

describe("WktUtils", function() {
    describe("makeArc", function() {
        it("should create an arc", function() {
            expect( WktUtils.makeArc(0,45,10) )
                .to.equal("POLYGON((0 0,10 0,9.876883405951379 1.5643446504023086,9.510565162951535 3.090169943749474,8.910065241883679 4.5399049973954675,8.090169943749475 5.877852522924732,7.0710678118654755 7.071067811865475))");
        });
    });
});