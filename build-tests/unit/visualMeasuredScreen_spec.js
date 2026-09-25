import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { readMeasuredScreen, screenMismatch } from "../../build-utils/visual/measuredScreen.js";
import runner from "../../walta-app/app/spec/visual/handshake.js";

// Every short-edge figure the device matrix was chosen on was an approximation:
// screenMetrics buckets on the landscape short edge in dp, and displayCaps reports
// points on iOS but pixels on Android, so a profile's advertised resolution is not
// the number the bands are drawn against. The device is the only thing that can
// say. It reports what screenMetrics made of its own display alongside the
// captures, and the host reads it back here.
describe("visual measured screen", function () {
    let dir;
    beforeEach(function () { dir = fs.mkdtempSync(path.join(os.tmpdir(), "visual-screen-")); });
    afterEach(function () { fs.rmSync(dir, { recursive: true, force: true }); });

    // The runner's port onto its visual dir — Ti.Filesystem on the device.
    function devicePort() {
        return { write: (name, contents) => fs.writeFileSync(path.join(dir, name), contents || "") };
    }

    it("reads back the screen the device measured", function () {
        runner.recordScreen(devicePort(), { relWidth: 874, relHeight: 402, isShort: false, isXHighRes: false });

        expect(readMeasuredScreen(dir)).to.deep.equal(
            { relWidth: 874, relHeight: 402, isShort: false, isXHighRes: false });
    });

    // The captures tree is uploaded as the CI artifact and the report links
    // everything in it by relative path, so what the host has already read
    // doesn't stay behind as a stray file beside the screenshots.
    it("takes the record out of the captures once it is read", function () {
        runner.recordScreen(devicePort(), { relHeight: 402 });

        readMeasuredScreen(dir);

        expect(fs.readdirSync(dir)).to.deep.equal([]);
    });

    it("answers nothing for a run whose device never reported its screen", function () {
        expect(readMeasuredScreen(dir)).to.equal(null);
    });

    // The declared size is what the band-coverage guard reasons about, so a
    // declaration that has drifted from the device makes the guard's answer wrong
    // while it still reads as green. The device's own measurement is the check.
    describe("against the declared screen", function () {
        it("finds a declared screen that is not the one rendered on", function () {
            expect(screenMismatch({ relWidth: 874, relHeight: 402 }, { width: 667, height: 375 }))
                .to.deep.equal({ measured: "874x402dp", declared: "667x375dp" });
        });

        it("accepts a declaration off by less than a whole dp, which is rounding", function () {
            expect(screenMismatch({ relWidth: 914.28, relHeight: 411.42 }, { width: 914, height: 411 }))
                .to.equal(null);
        });

        // Two absences, not one fault: a build that predates the screen record has
        // nothing to check, and a device nobody declared has nothing to check it
        // against. Neither is a drifted declaration.
        it("has nothing to say when either side is missing", function () {
            expect(screenMismatch(null, { width: 874, height: 402 })).to.equal(null);
            expect(screenMismatch({ relWidth: 874, relHeight: 402 }, undefined)).to.equal(null);
        });
    });
});
