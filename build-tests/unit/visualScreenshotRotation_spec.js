import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { Jimp } from "jimp";
import IosSimulatorLauncher from "../../build-utils/IosSimulatorLauncher.js";

const RED = 0xff0000ff;
const WHITE = 0xffffffff;

// A portrait frame with one corner marked, so the *direction* of the turn is
// observable rather than merely the resulting shape — both directions give a
// landscape image of the right size, so shape alone can't tell them apart and
// neither can code review.
async function writePortraitFrame(dest) {
    const img = new Jimp({ width: 10, height: 20, color: WHITE });
    img.setPixelColor(RED, 0, 0); // top-left
    await img.write(dest);
}

describe("visual screenshot rotation", function () {
    let dir;
    beforeEach(function () { dir = fs.mkdtempSync(path.join(os.tmpdir(), "visual-rot-")); });
    afterEach(function () { fs.rmSync(dir, { recursive: true, force: true }); });

    function launcher() {
        const execFile = (cmd, args, opts, cb) => {
            const dest = args[args.indexOf("screenshot") + 1];
            writePortraitFrame(dest).then(() => cb(null, "", ""), cb);
        };
        return new IosSimulatorLauncher({ execFile, udid: "UDID" });
    }

    async function capture() {
        const out = path.join(dir, "Menu.png");
        await launcher().screenshotFramebuffer(out);
        return Jimp.read(out);
    }

    function cornerOf(img) {
        const corners = {
            "top-left": [0, 0],
            "top-right": [img.bitmap.width - 1, 0],
            "bottom-left": [0, img.bitmap.height - 1],
            "bottom-right": [img.bitmap.width - 1, img.bitmap.height - 1],
        };
        return Object.keys(corners).find(c => img.getPixelColor(...corners[c]) === RED);
    }

    // The runner pins the capture landscape, so the turn is a constant — but the
    // wrong constant puts every capture upside down, and only the pixels say which.
    it("turns the frame the way the landscape the runner pins calls for", async function () {
        expect(cornerOf(await capture())).to.equal("bottom-left");
    });

    it("makes the frame landscape", async function () {
        const img = await capture();
        expect(img.bitmap.width).to.equal(20);
        expect(img.bitmap.height).to.equal(10);
    });

    it("leaves the raw portrait frame behind no more than the upright one", async function () {
        await capture();
        expect(fs.readdirSync(dir)).to.deep.equal(["Menu.png"]);
    });
});
