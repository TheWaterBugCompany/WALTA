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

	// The host cannot work out which size band a leg exercised: the bands are drawn
	// against the landscape short edge in dp, and displayCaps reports points on iOS
	// but pixels on Android. Only the device can say, so it reports it alongside the
	// captures — and a report the host cannot read back is no report at all.
	it("reports the screen it rendered on alongside the captures", async function () {
		await capture.captureAll([menuEntry()], { grep: "Menu" });

		var reported = JSON.parse(outputFile("screen.json").read().text);
		expect(reported).to.deep.equal(
			require("util/screenMetrics")(Ti.Platform.displayCaps, Ti.Platform.osname));
	});

	// The real manifest entry, so the spec exercises the shape the suite captures
	// rather than a hand-rolled stand-in — captured as a toImage snapshot, which
	// needs no host on the other end of the handshake.
	function menuEntry() {
		var entry = manifest.filter(function (e) { return e.name === "Menu"; })[0];
		return { name: entry.name, args: entry.args, capture: "toimage" };
	}
});
