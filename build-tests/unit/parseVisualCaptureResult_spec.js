import { expect } from "chai";
import { parseVisualCaptureResult } from "../../build-utils/parseVisualCaptureResult.js";

describe("parseVisualCaptureResult", function () {
    it("returns done with the count when capture finished", function () {
        expect(parseVisualCaptureResult("… VISUAL_CAPTURE_DONE count=12")).to.deep.equal({ status: "done", count: 12 });
    });

    it("returns failed with the message when capture threw", function () {
        expect(parseVisualCaptureResult("… VISUAL_CAPTURE_FAILED boom happened"))
            .to.deep.equal({ status: "failed", message: "boom happened" });
    });

    it("returns null for an ordinary line", function () {
        expect(parseVisualCaptureResult("VISUAL_CAPTURED name=Menu width=2622")).to.equal(null);
    });

    it("returns null for an empty line", function () {
        expect(parseVisualCaptureResult("")).to.equal(null);
    });
});
