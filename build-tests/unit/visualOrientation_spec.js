import { expect } from "chai";
import { rotationFor, readyMarker, parseReadyMarker } from "../../build-utils/visual/orientation.js";

// The app is landscape-locked but the device screenshots in physical portrait, so
// the host has to rotate. Rotating by a fixed amount can't tell the two landscape
// orientations apart, which is how every iOS capture ended up upside down — the
// device reports which way it settled and the host turns that into a rotation.
describe("visual capture orientation", function () {
    it("turns a portrait frame upright for each landscape the device can settle in", function () {
        expect(rotationFor("landscape-left", { width: 1206, height: 2622 })).to.equal(270);
        expect(rotationFor("landscape-right", { width: 1206, height: 2622 })).to.equal(90);
    });

    it("leaves a frame the device already delivered in landscape alone", function () {
        expect(rotationFor("landscape-left", { width: 2622, height: 1206 })).to.equal(0);
    });

    // The app settles in LANDSCAPE_LEFT; the fixed 90 this replaces was only ever
    // right for the other landscape, which is why every capture came out inverted.
    it("assumes the landscape the app settles in when the device reported nothing", function () {
        expect(rotationFor(undefined, { width: 1206, height: 2622 })).to.equal(270);
    });

    it("carries the orientation in the marker name, so listing the dir is enough to read it", function () {
        expect(parseReadyMarker(readyMarker("Menu", "landscape-right")))
            .to.deep.equal({ name: "Menu", orientation: "landscape-right" });
    });

    it("still recognises a marker from a runner that reports no orientation", function () {
        expect(parseReadyMarker("Menu.ready")).to.deep.equal({ name: "Menu", orientation: undefined });
    });

    it("is not confused by a file that merely mentions ready", function () {
        expect(parseReadyMarker("Menu.shot")).to.equal(null);
    });
});
