import { expect } from "chai";
import { deviceLabel } from "../../build-utils/visual/deviceLabel.js";

// Without --device a run used to land in a catch-all "local" directory, which
// says nothing about what rendered it and collects captures from every simulator
// the developer has used. Deriving the label from the device instead gives each
// its own baseline set — and lands on the same labels CI uses, so a local run
// diffs against the CI-rendered baselines for that device.
describe("visual run device label", function () {
    it("labels a run by the device that rendered it", function () {
        expect(deviceLabel("iPhone 17 Pro Max · iOS 26.3")).to.equal("iphone-17-pro-max");
    });

    it("ignores the OS version, so an OS bump keeps the baseline set", function () {
        expect(deviceLabel("iPhone 17 · iOS 26.4")).to.equal("iphone-17");
    });

    it("collapses punctuation an emulator model carries", function () {
        expect(deviceLabel("sdk_gphone64_arm64 · Android 14")).to.equal("sdk-gphone64-arm64");
    });
});
