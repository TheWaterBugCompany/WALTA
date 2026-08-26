// Renders each manifest screen, waits for the display to settle, and writes a
// PNG of it to applicationDataDirectory/visual/<name>.png for the host to pull
// and diff. The settle gate (waitForStable on toImage().length) is the whole
// reason this is reliable: postlayout fires before lazy tiles / async photos
// finish drawing, so capturing on postlayout alone yields blank frames.
var { openEntry, runsHere } = require("spec/visual/openEntry");
var waitForStable = require("util/waitForStable");

var OUTPUT_SUBDIR = "visual";

function outputDir() {
	var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, OUTPUT_SUBDIR);
	if (!dir.exists()) { dir.createDirectory(); }
	return dir;
}

// Wipe captures from a previous run so a screen dropped from the manifest doesn't
// leave a stale PNG the host would pull and flag as an unexpected diff.
function clearOutputDir() {
	var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, OUTPUT_SUBDIR);
	if (dir.exists()) { dir.deleteDirectory(true); }
}

function writePng(name, blob) {
	var file = Ti.Filesystem.getFile(outputDir().nativePath, name + ".png");
	file.write(blob);
	return file.nativePath;
}

function sleep(ms) {
	return new Promise(function (r) { setTimeout(r, ms); });
}

// Handshake markers live alongside the PNGs in the visual dir. The runner writes
// <name>.ready; the host screenshots the held frame and writes <name>.shot back;
// captureAll writes capture-done last. This is a file protocol precisely so it
// doesn't depend on the device log stream, which drops/batches lines under load
// (the iOS simctl flake that hung capture at the 600s timeout).
var SHOT_TIMEOUT_MS = 30000;
var SHOT_POLL_MS = 100;

function writeMarker(name) {
	Ti.Filesystem.getFile(outputDir().nativePath, name).write("");
}

function markerExists(name) {
	return Ti.Filesystem.getFile(outputDir().nativePath, name).exists();
}

// Wait for the host to acknowledge a framebuffer screenshot by writing <name>.shot.
// Returns whether it was acked; on timeout the runner logs and moves on so one
// stuck screen doesn't strand the rest (the host flags it as a missing capture).
async function waitForShot(name) {
	var deadline = Date.now() + SHOT_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (markerExists(name + ".shot")) { return true; }
		await sleep(SHOT_POLL_MS);
	}
	return false;
}

// Capture one screen and return metadata about it. The controller is torn down
// before returning so screens don't leak state into each other.
//
// Capture defaults to the actual simulator/emulator framebuffer (via the host),
// not view.toImage(): the framebuffer composites the OS notch / Dynamic Island
// cutover the app, so it's the only way to verify the safe area is respected and
// nothing important is occluded by the camera cutout — and it captures WebView /
// video / map content that toImage() can't see. We settle on toImage().length
// (cheap and reflects native layout), give any async content time to load, emit a
// READY marker for the host to screenshot on, then hold briefly so the shot lands
// before the next screen opens. `capture: "toimage"` opts a screen back into the
// in-app snapshot (faster, no host handshake) where the notch doesn't matter.
async function captureScreen(entry, entries) {
	// openEntry opens the screen the way the app does — through the View seam for a
	// window, overlaid on its host for a modal — and owns the teardown.
	var opened = await openEntry(entry, entries);
	var view = opened.view;
	await waitForStable(function () { return view.toImage().length; }, entry.settle);

	var meta;
	if (entry.capture === "toimage") {
		var blob = view.toImage();
		var path = writePng(entry.name, blob);
		Ti.API.info("VISUAL_CAPTURED name=" + entry.name +
			" width=" + blob.width + " height=" + blob.height + " length=" + blob.length +
			" path=" + path);
		meta = { name: entry.name, mode: "toimage", width: blob.width, height: blob.height, length: blob.length, path: path };
	} else {
		if (entry.loadMs) { await sleep(entry.loadMs); }
		// Signal the screen is up, then hold it until the host acks its shot — no
		// fixed hold, no log marker. The screen stays open for the whole wait.
		writeMarker(entry.name + ".ready");
		var acked = await waitForShot(entry.name);
		Ti.API.info("VISUAL_CAPTURED name=" + entry.name + " mode=framebuffer acked=" + acked);
		meta = { name: entry.name, mode: "framebuffer", acked: acked };
	}

	await opened.dispose();
	return meta;
}

// Capture every screen (optionally filtered to one by name). Serial, so only one
// window is on screen at a time — matching how the mocha runner opens screens.
async function captureAll(entries, { grep } = {}) {
	if (!grep) { clearOutputDir(); }
	var results = [];
	for (var i = 0; i < entries.length; i++) {
		if (grep && entries[i].name.indexOf(grep) === -1) { continue; }
		if (!runsHere(entries[i])) { continue; }
		// One screen's fixture blowing up must not lose every other capture — log
		// it and carry on. The host flags the screen as missing.
		try {
			results.push(await captureScreen(entries[i], entries));
		} catch (e) {
			Ti.API.error("VISUAL_CAPTURE_SCREEN_FAILED name=" + entries[i].name +
				" " + (e && e.message ? e.message : e));
		}
	}
	// The sentinel the host polls for: capture is complete, pull the toImage PNGs.
	// Written last so it can't appear before the final screen's .shot handshake.
	writeMarker("capture-done");
	return results;
}

exports.captureScreen = captureScreen;
exports.captureAll = captureAll;
exports.outputDir = outputDir;
