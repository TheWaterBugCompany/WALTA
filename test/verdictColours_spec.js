require("mocha");
const { expect } = require("chai");
const path = require("path");
const { Jimp } = require("jimp");

const colours = require("../walta-app/app/config.json").global.colors;

const IMAGES = path.join(__dirname, "..", "walta-app", "app", "assets", "images");

// The single most-used saturated colour in an icon — its ink, ignoring the
// transparent surround and any antialiased edge pixels.
async function inkColourOf(icon) {
    const img = await Jimp.read(path.join(IMAGES, icon));
    const counts = new Map();
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, i) {
        const [r, g, b, a] = [this.bitmap.data[i], this.bitmap.data[i + 1], this.bitmap.data[i + 2], this.bitmap.data[i + 3]];
        if (a < 200) { return; }
        if (Math.max(r, g, b) - Math.min(r, g, b) < 40) { return; }
        const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0").toUpperCase()).join("");
        counts.set(hex, (counts.get(hex) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// A hinted branch is marked twice — an icon beside it and an outline around it —
// and the two read as one mark only while they are the same colour. They are
// separate artefacts (a PNG and a palette entry) with nothing but this to hold
// them together, so each pair is pinned here.
describe("verdict colours", function () {
    it("gives the correct verdict the same green as its tick", async function () {
        expect(colours.success).to.equal(await inkColourOf("tick-icon.png"));
    });

    it("gives the incorrect verdict the same red as its cross", async function () {
        expect(colours.failure).to.equal(await inkColourOf("cross-icon.png"));
    });
});
