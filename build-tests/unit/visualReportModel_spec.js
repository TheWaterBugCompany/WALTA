import { expect } from "chai";
import { buildReportModel } from "../../build-utils/visual/reportModel.js";

function run(platform, device, results) {
    return { platform, device, results };
}

describe("visual report model", function () {
    it("lists every screen any run captured, in name order", function () {
        const model = buildReportModel([
            run("ios", "iphone-17", [{ name: "Menu", status: "pass" }]),
            run("android", "small", [{ name: "About", status: "pass" }, { name: "Menu", status: "pass" }]),
        ]);
        expect(model.screens.map((s) => s.name)).to.deep.equal(["About", "Menu"]);
    });

    it("gives each screen one cell per run, in run order", function () {
        const model = buildReportModel([
            run("ios", "iphone-17", [{ name: "Menu", status: "pass" }]),
            run("android", "small", [{ name: "Menu", status: "fail", diffPixels: 42 }]),
        ]);
        const [menu] = model.screens;
        expect(menu.cells.map((c) => c.status)).to.deep.equal(["pass", "fail"]);
        expect(menu.cells[1].diffPixels).to.equal(42);
    });

    it("marks a screen absent from a run so a gap in coverage is visible", function () {
        const model = buildReportModel([
            run("ios", "iphone-17", [{ name: "Menu", status: "pass" }]),
            run("android", "small", []),
        ]);
        expect(model.screens[0].cells.map((c) => c.status)).to.deep.equal(["pass", "absent"]);
    });

    it("names each run column by its platform and device", function () {
        const model = buildReportModel([run("ios", "iphone-17-pro-max", [])]);
        expect(model.runs[0]).to.include({ platform: "ios", device: "iphone-17-pro-max", id: "ios/iphone-17-pro-max" });
    });

    // The device label is whatever --device the caller typed ("local" by default),
    // so the column also carries what actually rendered it and when.
    it("carries the device a run was actually rendered on, and when", function () {
        const model = buildReportModel([
            { platform: "ios", device: "local", deviceName: "iPhone 17 Pro · iOS 26.3", capturedAt: "2026-08-26T02:39:47.801Z", results: [] },
        ]);
        expect(model.runs[0]).to.include({ deviceName: "iPhone 17 Pro · iOS 26.3", capturedAt: "2026-08-26T02:39:47.801Z" });
    });

    it("points a differing cell at its baseline, capture and diff images", function () {
        const model = buildReportModel([run("android", "small", [{ name: "Menu", status: "fail", diffPixels: 42 }])]);
        expect(model.screens[0].cells[0].images).to.deep.equal({
            baseline: "android/small/baseline/Menu.png",
            actual: "android/small/actual/Menu.png",
            diff: "android/small/report/Menu.diff.png",
        });
    });

    it("offers only the capture for a screen with no baseline yet", function () {
        const model = buildReportModel([run("android", "small", [{ name: "Menu", status: "new" }])]);
        expect(model.screens[0].cells[0].images).to.deep.equal({ actual: "android/small/actual/Menu.png" });
    });

    it("offers only the baseline for a screen the run failed to capture", function () {
        const model = buildReportModel([run("android", "small", [{ name: "Menu", status: "missing" }])]);
        expect(model.screens[0].cells[0].images).to.deep.equal({ baseline: "android/small/baseline/Menu.png" });
    });

    it("offers no image for a screen absent from a run", function () {
        const model = buildReportModel([
            run("ios", "iphone-17", [{ name: "Menu", status: "pass" }]),
            run("android", "small", []),
        ]);
        expect(model.screens[0].cells[1].images).to.deep.equal({});
    });

    it("tags each cell with the run it came from so a zoomed screen says which device it is", function () {
        const model = buildReportModel([run("ios", "iphone-17", [{ name: "Menu", status: "pass" }])]);
        expect(model.screens[0].cells[0].runId).to.equal("ios/iphone-17");
    });

    it("counts each status so the header says whether the run needs attention", function () {
        const model = buildReportModel([
            run("ios", "iphone-17", [{ name: "Menu", status: "pass" }, { name: "About", status: "fail" }]),
            run("android", "small", [{ name: "Menu", status: "new" }, { name: "About", status: "fail" }]),
        ]);
        expect(model.summary).to.deep.equal({ total: 4, pass: 1, fail: 2, new: 1, missing: 0, updated: 0, absent: 0 });
    });
});
