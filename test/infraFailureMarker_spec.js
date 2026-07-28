require("mocha");
const { expect } = require("chai");
const { markerLine, parseInfraFailures } = require("../features/support/infra-failure-marker");

describe("infra-failure marker", function () {
    it("round-trips a scenario name and reason through the marker", function () {
        const line = markerLine("Review history without server login", "session-dead");
        expect(parseInfraFailures(line)).to.deep.equal([
            { reason: "session-dead", name: "Review history without server login" },
        ]);
    });

    it("carries the environmental reason distinctly from session-dead", function () {
        const line = markerLine("Sample collection", "environmental");
        expect(parseInfraFailures(line)).to.deep.equal([
            { reason: "environmental", name: "Sample collection" },
        ]);
    });

    it("pulls every marked scenario (with its reason) out of a mixed output blob", function () {
        const output = [
            "some cucumber noise",
            markerLine("Scenario A", "session-dead"),
            "8 scenarios (7 passed, 1 failed)",
            markerLine("Scenario B: with punctuation, and a date 3/4", "environmental"),
            "more noise",
        ].join("\n");
        expect(parseInfraFailures(output)).to.deep.equal([
            { reason: "session-dead", name: "Scenario A" },
            { reason: "environmental", name: "Scenario B: with punctuation, and a date 3/4" },
        ]);
    });

    it("returns nothing when there are no markers", function () {
        expect(parseInfraFailures("8 scenarios (8 passed)\nall good")).to.deep.equal([]);
    });
});
