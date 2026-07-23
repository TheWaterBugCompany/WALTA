require("mocha");
const { expect } = require("chai");
const { markerLine, parseInfraFailures } = require("../features/support/infra-failure-marker");

describe("infra-failure marker", function () {
    it("round-trips a scenario name through the marker", function () {
        const line = markerLine("Review history without server login");
        expect(parseInfraFailures(line)).to.deep.equal(["Review history without server login"]);
    });

    it("pulls every marked scenario out of a mixed output blob", function () {
        const output = [
            "some cucumber noise",
            markerLine("Scenario A"),
            "8 scenarios (7 passed, 1 failed)",
            markerLine("Scenario B: with punctuation, and a date 3/4"),
            "more noise",
        ].join("\n");
        expect(parseInfraFailures(output)).to.deep.equal([
            "Scenario A",
            "Scenario B: with punctuation, and a date 3/4",
        ]);
    });

    it("returns nothing when there are no markers", function () {
        expect(parseInfraFailures("8 scenarios (8 passed)\nall good")).to.deep.equal([]);
    });
});
