require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { captureScreen } = require("spec/visual/captureScreens");
var manifest = require("spec/visual/manifest");

// Drives the real capture path (render → settle → toImage → write PNG) for every
// manifest screen on device. Verifies the mechanism — a valid, correctly-oriented
// PNG lands on disk. Whether the pixels are *right* is the host diff's job.
describe("VisualCapture", function () {
	manifest.forEach(function (entry) {
		it("captures " + entry.name + " to a landscape PNG on disk", async function () {
			var result = await captureScreen(entry);
			// the app is landscape-locked, so every capture is wider than it is tall
			expect(result.width).to.be.greaterThan(result.height);
			expect(result.length).to.be.greaterThan(0);
			var file = Ti.Filesystem.getFile(result.path);
			expect(file.exists()).to.equal(true);
		});
	});
});
