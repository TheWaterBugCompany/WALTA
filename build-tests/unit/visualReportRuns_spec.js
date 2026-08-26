import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { collectRuns } from "../../build-utils/visual/collectRuns.js";

function writeRun(root, platform, device, results) {
    const dir = path.join(root, platform, device, "report");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "results.json"), JSON.stringify({ platform, device, results }));
}

describe("visual report run collection", function () {
    let root;
    beforeEach(function () { root = fs.mkdtempSync(path.join(os.tmpdir(), "visual-runs-")); });
    afterEach(function () { fs.rmSync(root, { recursive: true, force: true }); });

    it("finds every captured run under the captures root", function () {
        writeRun(root, "ios", "iphone-17", [{ name: "Menu", status: "pass" }]);
        writeRun(root, "android", "small", [{ name: "Menu", status: "fail" }]);
        expect(collectRuns(root).map((r) => r.device)).to.deep.equal(["small", "iphone-17"]);
    });

    it("orders columns by platform then device so the gallery is stable run to run", function () {
        writeRun(root, "ios", "iphone-17-pro-max", []);
        writeRun(root, "ios", "iphone-17", []);
        writeRun(root, "android", "small", []);
        expect(collectRuns(root).map((r) => `${r.platform}/${r.device}`))
            .to.deep.equal(["android/small", "ios/iphone-17", "ios/iphone-17-pro-max"]);
    });

    it("returns nothing when no run has been captured yet", function () {
        expect(collectRuns(path.join(root, "never-captured"))).to.deep.equal([]);
    });
});
