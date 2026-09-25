import { expect } from "chai";
import { readDevices, expectedRuns, matrixFor, bandCoverage, declaredScreenFor } from "../../build-utils/visual/devices.js";
import screenMetrics from "../../walta-app/app/lib/util/screenMetrics.js";

// One declaration of the device matrix, read by both the CI workflow (to build
// its job matrices) and the report (to know which columns to expect). Two copies
// would drift, and the report would stop noticing a leg that never ran.
describe("visual device matrix", function () {
    const DEVICES = {
        ios: [{ label: "iphone-17", name: "iPhone 17" }],
        android: [{ label: "small", avd: "Nexus5_API34", profile: "Nexus 5", api: 34, screen: { width: 640, height: 360 } }],
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

    // A size band with no device in the matrix is a set of TSS rules nothing ever
    // renders and no baseline ever covers — dead code a reader still has to work
    // out when it applies to. Three screens were fixed one at a time for
    // overflowing a short phone, every one found by a person looking at a device.
    // The rule this pins is that a band either gets a leg or gets retired.
    describe("size band coverage", function () {
        it("renders every size band the layouts are written against", function () {
            const coverage = bandCoverage(readDevices());
            // The bands come from screenMetrics, not a list here, so a band added
            // to the app arrives in this test with no device covering it.
            const uncovered = screenMetrics.BANDS.filter((band) => coverage[band].length === 0);

            expect(uncovered, `size bands no declared device renders: ${uncovered.join(", ")}`)
                .to.deep.equal([]);
        });

        // Without a declared screen a leg cannot be attributed to a band, so the
        // coverage above would read as a gap in the matrix rather than a gap in
        // the declaration. Say which it is.
        it("declares the screen every device renders at", function () {
            const devices = readDevices();
            const undeclared = Object.keys(devices).flatMap((platform) =>
                devices[platform].filter((d) => !d.screen).map((d) => `${platform}/${d.label}`));

            expect(undeclared, `devices with no declared screen: ${undeclared.join(", ")}`)
                .to.deep.equal([]);
        });

        it("hands back the screen one leg declares, to check against what it rendered on", function () {
            expect(declaredScreenFor(DEVICES, "android", "small")).to.deep.equal({ width: 640, height: 360 });
            expect(declaredScreenFor(DEVICES, "android", "unheard-of")).to.equal(undefined);
        });

        it("attributes a device to every band its screen is in", function () {
            const coverage = bandCoverage({
                ios: [{ label: "iphone-se", screen: { width: 667, height: 375 } }],
            });

            expect(coverage.isShort).to.deep.equal(["ios/iphone-se"]);
            expect(coverage.isHighRes).to.deep.equal(["ios/iphone-se"]);
            expect(coverage.isXHighRes).to.deep.equal([]);
        });
    });
});
