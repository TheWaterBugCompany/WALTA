import { expect } from "chai";
import { Jimp } from "jimp";
import fs from "fs";
import os from "os";
import path from "path";
import { compareRun } from "../../build-utils/visual/compareRun.js";

const WHITE = 0xffffffff;
const RED = 0xff0000ff;

async function writePng(dir, name, colour, block) {
    const img = new Jimp({ width: 20, height: 16, color: colour });
    if (block) {
        for (let x = block.x; x < block.x + block.w; x += 1) {
            for (let y = block.y; y < block.y + block.h; y += 1) {
                img.setPixelColor(block.colour, x, y);
            }
        }
    }
    await img.write(path.join(dir, `${name}.png`));
}

function tmpdir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "visual-run-"));
}

describe("compareRun", function () {
    let baselineDir; let actualDir; let outDir;
    beforeEach(function () {
        baselineDir = tmpdir();
        actualDir = tmpdir();
        outDir = tmpdir();
    });
    afterEach(function () {
        for (const d of [baselineDir, actualDir, outDir]) {
            fs.rmSync(d, { recursive: true, force: true });
        }
    });

    it("passes when every capture matches its baseline", async function () {
        await writePng(baselineDir, "Menu", WHITE);
        await writePng(actualDir, "Menu", WHITE);
        const run = await compareRun({ baselineDir, actualDir, outDir });
        expect(run.pass).to.equal(true);
        expect(run.results).to.have.length(1);
        expect(run.results[0]).to.include({ name: "Menu", status: "pass" });
    });

    it("fails and writes a diff image when a capture differs", async function () {
        await writePng(baselineDir, "Menu", WHITE);
        await writePng(actualDir, "Menu", WHITE, { x: 2, y: 2, w: 6, h: 6, colour: RED });
        const run = await compareRun({ baselineDir, actualDir, outDir });
        expect(run.pass).to.equal(false);
        const result = run.results[0];
        expect(result.status).to.equal("fail");
        expect(result.diffPixels).to.equal(36);
        expect(fs.existsSync(result.diffImagePath)).to.equal(true);
    });

    it("flags a capture that has no baseline as new", async function () {
        await writePng(actualDir, "BrandNew", WHITE);
        const run = await compareRun({ baselineDir, actualDir, outDir });
        expect(run.pass).to.equal(false);
        expect(run.results[0]).to.include({ name: "BrandNew", status: "new" });
    });

    it("flags a baseline with no capture as missing", async function () {
        await writePng(baselineDir, "Gone", WHITE);
        const run = await compareRun({ baselineDir, actualDir, outDir });
        expect(run.pass).to.equal(false);
        expect(run.results[0]).to.include({ name: "Gone", status: "missing" });
    });

    it("writes captures into the baseline dir and passes when update is set", async function () {
        await writePng(baselineDir, "Menu", WHITE);
        await writePng(actualDir, "Menu", WHITE, { x: 2, y: 2, w: 6, h: 6, colour: RED });
        const run = await compareRun({ baselineDir, actualDir, outDir, update: true });
        expect(run.pass).to.equal(true);
        expect(run.results[0].status).to.equal("updated");
        // the baseline should now equal the (previously differing) capture
        const refreshed = await compareRun({ baselineDir, actualDir, outDir });
        expect(refreshed.pass).to.equal(true);
    });
});
