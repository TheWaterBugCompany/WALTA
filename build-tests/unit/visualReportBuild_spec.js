import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { buildReport } from "../../build-utils/visual/buildReport.js";

function writeRun(root, platform, device, results) {
    const dir = path.join(root, platform, device, "report");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "results.json"), JSON.stringify({ platform, device, results }));
}

describe("visual report build", function () {
    let root;
    beforeEach(function () { root = fs.mkdtempSync(path.join(os.tmpdir(), "visual-report-")); });
    afterEach(function () { fs.rmSync(root, { recursive: true, force: true }); });

    it("writes a page covering every run captured under the root", function () {
        writeRun(root, "ios", "iphone-17", [{ name: "Menu", status: "pass" }]);
        writeRun(root, "android", "small", [{ name: "Menu", status: "fail", diffPixels: 9 }]);

        const report = buildReport({ root });

        expect(report.runs).to.equal(2);
        expect(report.screens).to.equal(1);
        const html = fs.readFileSync(report.file, "utf8");
        expect(html).to.contain("Menu").and.to.contain("iphone-17").and.to.contain("small");
    });

    it("sits at the root of the captures tree so its relative image paths resolve", function () {
        writeRun(root, "ios", "iphone-17", [{ name: "Menu", status: "pass" }]);
        expect(buildReport({ root }).file).to.equal(path.join(root, "report.html"));
    });

    // A leg that dies before capturing anything uploads no results, and its column
    // would simply vanish — leaving a report that looks complete. The devices the
    // matrix is meant to cover are declared, so a leg that produced nothing shows
    // up as a column of gaps instead.
    it("shows a column for a declared device even when its run produced nothing", function () {
        writeRun(root, "ios", "iphone-17", [{ name: "Menu", status: "pass" }]);
        const expected = [
            { platform: "ios", device: "iphone-17" },
            { platform: "android", device: "small" },
        ];

        const report = buildReport({ root, expected });

        expect(report.runs).to.equal(2);
        expect(report.missingRuns).to.deep.equal(["android/small"]);
        const html = fs.readFileSync(report.file, "utf8");
        expect(html).to.contain("small").and.to.contain("no captures");
    });

    it("still includes a run that was captured without being declared", function () {
        writeRun(root, "ios", "iphone-17", []);
        writeRun(root, "ios", "some-local-sim", []);
        const report = buildReport({ root, expected: [{ platform: "ios", device: "iphone-17" }] });
        expect(report.runs).to.equal(2);
        expect(report.missingRuns).to.deep.equal([]);
    });

    it("still writes a page when nothing was captured, saying so", function () {
        expect(buildReport({ root }).runs).to.equal(0);
        expect(fs.readFileSync(path.join(root, "report.html"), "utf8")).to.contain("No screens were captured");
    });
});
