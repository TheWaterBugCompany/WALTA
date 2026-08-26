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

	// The real manifest entry, so the spec exercises the shape the suite captures
	// rather than a hand-rolled stand-in — captured as a toImage snapshot, which
	// needs no host on the other end of the handshake.
	function menuEntry() {
		var entry = manifest.filter(function (e) { return e.name === "Menu"; })[0];
		return { name: entry.name, args: entry.args, capture: "toimage" };
	}
});
