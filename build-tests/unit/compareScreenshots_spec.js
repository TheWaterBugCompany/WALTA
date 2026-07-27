import { expect } from "chai";
import { Jimp } from "jimp";
import { compareScreenshots } from "../../build-utils/visual/compareScreenshots.js";

// Hermetic fixtures: solid-colour PNGs, optionally with a differing block
// painted in, so the test needs no binary fixture files.
async function pngBuffer(width, height, colour, block) {
    const img = new Jimp({ width, height, color: colour });
    if (block) {
        for (let x = block.x; x < block.x + block.w; x += 1) {
            for (let y = block.y; y < block.y + block.h; y += 1) {
                img.setPixelColor(block.colour, x, y);
            }
        }
    }
    return img.getBuffer("image/png");
}

const WHITE = 0xffffffff;
const RED = 0xff0000ff;

describe("compareScreenshots", function () {
    it("reports zero diff and passes when the images are identical", async function () {
        const baseline = await pngBuffer(40, 30, WHITE);
        const actual = await pngBuffer(40, 30, WHITE);
        const result = await compareScreenshots(baseline, actual);
        expect(result.pass).to.equal(true);
        expect(result.diffRatio).to.equal(0);
        expect(result.diffPixels).to.equal(0);
    });

    it("fails and counts the differing pixels when a region changed", async function () {
        const baseline = await pngBuffer(40, 30, WHITE);
        // a 10x10 red block = 100 of 1200 pixels changed
        const actual = await pngBuffer(40, 30, WHITE, { x: 5, y: 5, w: 10, h: 10, colour: RED });
        const result = await compareScreenshots(baseline, actual);
        expect(result.pass).to.equal(false);
        expect(result.diffPixels).to.equal(100);
        expect(result.diffRatio).to.be.closeTo(100 / 1200, 1e-9);
    });

    it("passes a small diff that is within the allowed tolerance", async function () {
        const baseline = await pngBuffer(40, 30, WHITE);
        // 4 of 1200 pixels = 0.33% changed
        const actual = await pngBuffer(40, 30, WHITE, { x: 0, y: 0, w: 2, h: 2, colour: RED });
        const result = await compareScreenshots(baseline, actual, { failRatio: 0.01 });
        expect(result.pass).to.equal(true);
        expect(result.diffPixels).to.equal(4);
    });

    it("fails when the dimensions differ, without attempting a pixel diff", async function () {
        const baseline = await pngBuffer(40, 30, WHITE);
        const actual = await pngBuffer(50, 30, WHITE);
        const result = await compareScreenshots(baseline, actual);
        expect(result.pass).to.equal(false);
        expect(result.dimensionsMatch).to.equal(false);
    });

    it("returns a diff image buffer when there is a difference", async function () {
        const baseline = await pngBuffer(40, 30, WHITE);
        const actual = await pngBuffer(40, 30, WHITE, { x: 5, y: 5, w: 10, h: 10, colour: RED });
        const result = await compareScreenshots(baseline, actual);
        expect(result.diffImage).to.be.instanceOf(Buffer);
        // it should be a readable PNG of the same dimensions
        const img = await Jimp.read(result.diffImage);
        expect(img.bitmap.width).to.equal(40);
        expect(img.bitmap.height).to.equal(30);
    });
});
