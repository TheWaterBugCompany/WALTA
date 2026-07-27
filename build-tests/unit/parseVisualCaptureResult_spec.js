import { expect } from "chai";
import { parseVisualCaptureResult } from "../../build-utils/parseVisualCaptureResult.js";

describe("parseVisualCaptureResult", function () {
    it("returns done with the count and device dir when capture finished", function () {
        expect(parseVisualCaptureResult("… VISUAL_CAPTURE_DONE count=12 dir=/data/data/net.thewaterbug.waterbug/files/visual"))
            .to.deep.equal({ status: "done", count: 12, dir: "/data/data/net.thewaterbug.waterbug/files/visual" });
    });

    it("returns done with a null dir when the marker omits it", function () {
        expect(parseVisualCaptureResult("… VISUAL_CAPTURE_DONE count=3"))
            .to.deep.equal({ status: "done", count: 3, dir: null });
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
