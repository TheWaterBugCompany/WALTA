import { expect } from "chai";
import { readDevices, expectedRuns, matrixFor } from "../../build-utils/visual/devices.js";

// One declaration of the device matrix, read by both the CI workflow (to build
// its job matrices) and the report (to know which columns to expect). Two copies
// would drift, and the report would stop noticing a leg that never ran.
describe("visual device matrix", function () {
    const DEVICES = {
        ios: [{ label: "iphone-17", name: "iPhone 17" }],
        android: [{ label: "small", avd: "Nexus5_API34", profile: "Nexus 5", api: 34 }],
    };

    it("declares the devices CI captures on", function () {
        const devices = readDevices();
        expect(Object.keys(devices)).to.have.members(["ios", "android"]);
        expect(devices.ios.map((d) => d.label)).to.include("iphone-17-pro-max");
    });

    it("lists every platform's devices as the runs a report should expect", function () {
        expect(expectedRuns(DEVICES)).to.deep.equal([
            { platform: "android", device: "small" },
            { platform: "ios", device: "iphone-17" },
        ]);
    });

    it("hands one platform's entries to its workflow job as a matrix", function () {
        expect(matrixFor(DEVICES, "android")).to.deep.equal(DEVICES.android);
    });
});
