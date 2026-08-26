import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { persistRun } from "../../build-utils/visual/persistRun.js";
import { collectRuns } from "../../build-utils/visual/collectRuns.js";

describe("visual run persistence", function () {
    let root; let baselineDir; let deviceDir;
    beforeEach(function () {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "visual-persist-"));
        baselineDir = path.join(root, "baselines");
        deviceDir = path.join(root, "captures", "ios", "iphone-17");
        fs.mkdirSync(baselineDir, { recursive: true });
        fs.mkdirSync(deviceDir, { recursive: true });
    });
    afterEach(function () { fs.rmSync(root, { recursive: true, force: true }); });

    function persist(results) {
        return persistRun({ platform: "ios", device: "iphone-17", deviceDir, baselineDir, results });
    }

    it("records the run where the report builder looks for it", function () {
        persist([{ name: "Menu", status: "pass" }]);
        const [run] = collectRuns(path.join(root, "captures"));
        expect(run).to.include({ platform: "ios", device: "iphone-17" });
        expect(run.results).to.deep.equal([{ name: "Menu", status: "pass" }]);
    });

    it("copies the baselines in beside the captures so the report stands alone", function () {
        fs.writeFileSync(path.join(baselineDir, "Menu.png"), "baseline-bytes");
        persist([{ name: "Menu", status: "pass" }]);
        expect(fs.readFileSync(path.join(deviceDir, "baseline", "Menu.png"), "utf8")).to.equal("baseline-bytes");
    });

    it("drops baselines left over from an earlier run's screen list", function () {
        fs.mkdirSync(path.join(deviceDir, "baseline"), { recursive: true });
        fs.writeFileSync(path.join(deviceDir, "baseline", "Retired.png"), "stale");
        persist([]);
        expect(fs.existsSync(path.join(deviceDir, "baseline", "Retired.png"))).to.equal(false);
    });

    it("records a first run that has no baselines to copy yet", function () {
        fs.rmSync(baselineDir, { recursive: true });
        persist([{ name: "Menu", status: "new" }]);
        expect(collectRuns(path.join(root, "captures"))).to.have.length(1);
    });
});
