require("mocha");
const { expect } = require("chai");
const {
    isEnvironmentalFailure,
    GPS_LOCK_NOT_OBTAINED,
    SAMPLE_TRAY_TILE_MISSING,
} = require("../features/support/environmental-failures");

describe("environmental-failure classifier", function () {
    it("flags a GPS-lock timeout as environmental", function () {
        expect(isEnvironmentalFailure("Error: " + GPS_LOCK_NOT_OBTAINED)).to.equal(true);
    });

    it("flags a sample-tray-tile timeout as environmental (any tile fragment)", function () {
        expect(isEnvironmentalFailure(`${SAMPLE_TRAY_TILE_MISSING} starting with "Taxon 12, "`)).to.equal(true);
        expect(isEnvironmentalFailure(`${SAMPLE_TRAY_TILE_MISSING} for "Water Boatman"`)).to.equal(true);
    });

    it("does not flag a genuine assertion failure", function () {
        expect(isEnvironmentalFailure("expected 42 to equal 7")).to.equal(false);
    });

    it("does not flag an empty or missing message", function () {
        expect(isEnvironmentalFailure("")).to.equal(false);
        expect(isEnvironmentalFailure(undefined)).to.equal(false);
    });
});
