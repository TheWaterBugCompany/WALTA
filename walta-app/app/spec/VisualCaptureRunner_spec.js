require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var capture = require("spec/visual/captureScreens");
var manifest = require("spec/visual/manifest");

// The capture runner's output dir is a handshake surface, not just a place PNGs
// land: the host polls it and treats `capture-done` as "this run has finished".
// Anything left there by a previous run is therefore read as this run's result.
describe("visual capture runner", function () {
	function outputFile(name) {
		return Ti.Filesystem.getFile(capture.outputDir().nativePath, name);
	}

	function seedPreviousRun() {
		outputFile("Stale.png").write("not a real capture");
		outputFile("capture-done").write("");
	}

	// A grep run used to skip the wipe, so the previous run's PNGs *and* its
	// capture-done sentinel survived — the host saw the stale sentinel instantly,
	// pulled the old screenshots and reported them as the new run's.
	it("clears a previous run's output even when filtering to one screen", async function () {
		seedPreviousRun();

		await capture.captureAll([menuEntry()], { grep: "Menu" });

		expect(outputFile("Stale.png").exists(), "a previous run's capture survived").to.equal(false);
		expect(outputFile("Menu.png").exists(), "this run's capture is missing").to.equal(true);
	});

	// iOS re-resolves a window's orientation while the device is flat, so screens
	// otherwise settle in either landscape — which turns the captured frame the
	// other way up *and* mirrors the safe-area insets, so the notch changes sides.
	// TopLevelWindow pins each window it opens to the landscape already in use, so
	// the runner seeds that with the one landscape it captures in, before the
	// screen opens.
	if (OS_IOS) {
		it("pins a screen to the capture landscape even when the last one settled in the other", async function () {
			Alloy.Globals.lastLandscapeOrientation = otherLandscape();
			var entry = menuEntry(), pinnedWhenOpened;

			await capture.captureAll([{ name: entry.name, capture: "toimage", args: function () {
				pinnedWhenOpened = Alloy.Globals.lastLandscapeOrientation;
				return entry.args();
			} }]);

			expect(pinnedWhenOpened).to.equal(capture.CAPTURE_LANDSCAPE);
		});
	}

	function otherLandscape() {
		return capture.CAPTURE_LANDSCAPE === Ti.UI.LANDSCAPE_RIGHT ? Ti.UI.LANDSCAPE_LEFT : Ti.UI.LANDSCAPE_RIGHT;
	}

	// The real manifest entry, so the spec exercises the shape the suite captures
	// rather than a hand-rolled stand-in — captured as a toImage snapshot, which
	// needs no host on the other end of the handshake.
	function menuEntry() {
		var entry = manifest.filter(function (e) { return e.name === "Menu"; })[0];
		return { name: entry.name, args: entry.args, capture: "toimage" };
	}
});
