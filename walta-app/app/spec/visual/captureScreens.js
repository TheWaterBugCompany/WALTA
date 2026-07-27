// Renders each manifest screen, waits for the display to settle, and writes a
// PNG of it to applicationDataDirectory/visual/<name>.png for the host to pull
// and diff. The settle gate (waitForStable on toImage().length) is the whole
// reason this is reliable: postlayout fires before lazy tiles / async photos
// finish drawing, so capturing on postlayout alone yields blank frames.
var { controllerOpenTest, closeWindow } = require("spec/util/TestUtils");
var waitForStable = require("util/waitForStable");

var OUTPUT_SUBDIR = "visual";

function outputDir() {
	var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, OUTPUT_SUBDIR);
	if (!dir.exists()) { dir.createDirectory(); }
	return dir;
}

function writePng(name, blob) {
	var file = Ti.Filesystem.getFile(outputDir().nativePath, name + ".png");
	file.write(blob);
	return file.nativePath;
}

// Capture one screen and return metadata about the written PNG. The controller
// is torn down before returning so screens don't leak state into each other.
async function captureScreen(entry) {
	var ctl = entry.create();
	await controllerOpenTest(ctl);
	var view = ctl.getView();
	await waitForStable(function () { return view.toImage().length; }, entry.settle);
	var blob = view.toImage();
	var path = writePng(entry.name, blob);
	Ti.API.info("VISUAL_CAPTURED name=" + entry.name +
		" width=" + blob.width + " height=" + blob.height + " length=" + blob.length);
	await closeWindow(view);
	if (typeof ctl.cleanUp === "function") { ctl.cleanUp(); }
	return { name: entry.name, width: blob.width, height: blob.height, length: blob.length, path: path };
}

// Capture every screen (optionally filtered to one by name). Serial, so only one
// window is on screen at a time — matching how the mocha runner opens screens.
async function captureAll(entries, { grep } = {}) {
	var results = [];
	for (var i = 0; i < entries.length; i++) {
		if (grep && entries[i].name.indexOf(grep) === -1) { continue; }
		results.push(await captureScreen(entries[i]));
	}
	return results;
}

exports.captureScreen = captureScreen;
exports.captureAll = captureAll;
exports.outputDir = outputDir;
