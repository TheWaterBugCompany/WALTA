import { expect } from "chai";
import { Jimp } from "jimp";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { looksBlank, inkFraction } from "../../build-utils/visual/blankFrame.js";

// 100x100 so a painted block's share of the frame is readable as a percentage.
async function writePng(name, paint) {
    const image = new Jimp({ width: 100, height: 100, color: 0xffffffff });
    paint(image);
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "blank-"));
    const file = path.join(dir, name);
    await image.write(file);
    return file;
}

function paintBlock(image, x, y, w, h) {
    image.scan(x, y, w, h, function (px, py, idx) {
        this.bitmap.data[idx] = 0; this.bitmap.data[idx + 1] = 0; this.bitmap.data[idx + 2] = 0;
    });
}

describe("blankFrame", function () {
    it("reads a frame of a single colour as empty", async function () {
        const file = await writePng("flat.png", () => {});
        expect(await inkFraction(file)).to.equal(0);
        expect(await looksBlank(file)).to.equal(true);
    });

    it("reads an all-black frame as empty — the background is whatever colour fills it", async function () {
        const file = await writePng("black.png", (image) => paintBlock(image, 0, 0, 100, 100));
        expect(await inkFraction(file)).to.equal(0);
        expect(await looksBlank(file)).to.equal(true);
    });

    it("still calls a frame blank when only a close button survives on it", async function () {
        const file = await writePng("chrome-only.png", (image) => paintBlock(image, 90, 2, 6, 6));
        expect(await looksBlank(file)).to.equal(true);
    });

    it("does not call a rendered screen blank", async function () {
        const file = await writePng("rendered.png", (image) => paintBlock(image, 10, 10, 40, 40));
        expect(await inkFraction(file)).to.be.greaterThan(0.15);
        expect(await looksBlank(file)).to.equal(false);
    });
});
