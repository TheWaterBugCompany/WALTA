require("mocha");
const { expect } = require("chai");
const path = require("path");
const { Jimp } = require("jimp");

// The verdict icons were authored with a 1px frame around the artboard in the
// app's own primary teal. iOS composites it, Android drops it, so the same tick
// rendered on two phones is not the same tick. The icons carry their shape and
// nothing else — the edge of the asset is empty.
const ICONS = ["tick-icon", "cross-icon"];
const IMAGES = path.join(__dirname, "../walta-app/app/assets/images");
const BAND = 3;

async function edgePixels(name) {
    const { bitmap } = await Jimp.read(path.join(IMAGES, `${name}.png`));
    const { width, height, data } = bitmap;
    const alphaAt = (x, y) => data[(y * width + x) * 4 + 3];
    const found = [];
    for (let d = 0; d < BAND; d++) {
        for (let x = 0; x < width; x++) {
            for (const y of [d, height - 1 - d]) if (alphaAt(x, y) > 0) found.push({ x, y, alpha: alphaAt(x, y) });
        }
        for (let y = 0; y < height; y++) {
            for (const x of [d, width - 1 - d]) if (alphaAt(x, y) > 0) found.push({ x, y, alpha: alphaAt(x, y) });
        }
    }
    return found;
}

describe("verdict icon assets", function () {
    ICONS.forEach(function (name) {
        it(`${name} draws nothing on its outer edge`, async function () {
            const edge = await edgePixels(name);
            const worst = edge.reduce((m, p) => (p.alpha > m.alpha ? p : m), { alpha: 0 });
            expect(edge, `${edge.length} edge pixels drawn, worst alpha ${worst.alpha} at ${worst.x},${worst.y}`).to.be.empty;
        });
    });
});
