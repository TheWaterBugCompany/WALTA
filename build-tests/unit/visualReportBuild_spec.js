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

    it("still writes a page when nothing was captured, saying so", function () {
        expect(buildReport({ root }).runs).to.equal(0);
        expect(fs.readFileSync(path.join(root, "report.html"), "utf8")).to.contain("No screens were captured");
    });
});
