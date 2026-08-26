require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var capture = require("spec/visual/captureScreens");

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

		await capture.captureAll([{ name: "Menu", create: makeMenu, capture: "toimage" }], { grep: "Menu" });

		expect(outputFile("Stale.png").exists(), "a previous run's capture survived").to.equal(false);
		expect(outputFile("Menu.png").exists(), "this run's capture is missing").to.equal(true);
	});

	function makeMenu() {
		var CerdiApi = require("spec/mocks/MockCerdiApi");
		Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi(Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret);
		return Alloy.createController("Menu", { unknown_bug: true });
	}
});
