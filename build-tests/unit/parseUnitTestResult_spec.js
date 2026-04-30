import { expect } from "chai";
import { parseUnitTestResult } from "../../build-utils/parseUnitTestResult.js";

describe("parseUnitTestResult", function () {
    it("returns 'passed' when the line contains UNIT_TESTS_PASSED", function () {
        expect(parseUnitTestResult("04-30 18:14:48.194 16071 16071 I TiAPI   :  UNIT_TESTS_PASSED")).to.equal("passed");
    });

    it("returns 'failed' when the line contains UNIT_TESTS_FAILED", function () {
        expect(parseUnitTestResult("04-30 18:14:48.194 16071 16071 I TiAPI   :  UNIT_TESTS_FAILED")).to.equal("failed");
    });

    it("returns null when the line contains neither marker", function () {
        expect(parseUnitTestResult("04-30 18:14:48.194 16071 16071 I TiAPI   :  303 passing")).to.equal(null);
    });

    it("returns null for an empty line", function () {
        expect(parseUnitTestResult("")).to.equal(null);
    });
});
