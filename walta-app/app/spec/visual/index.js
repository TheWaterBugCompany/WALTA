// On-device visual-regression capture runner — the visual twin of spec/index.js.
// Reached only when index.js dispatches on the `visual_capture` launch arg. Opens
// a black window and captures every manifest screen into
// applicationDataDirectory/visual/. The host↔runner protocol is a FILE HANDSHAKE
// in that dir (see captureScreens.js): per-screen <name>.ready / <name>.shot and
// a final capture-done sentinel — no device-log dependence, so simctl/logcat
// dropping lines can't stall capture. The log lines below are for humans reading
// CI output only; the host polls the files.
//
// A screen filter is passed through the same `test_grep` launch arg the mocha
// runner uses, so `--grep=Menu` captures a single screen for fast iteration.

function readGrep() {
	try {
		if (Ti.Platform.osname === "android") {
			var intent = Ti.Android.currentActivity && Ti.Android.currentActivity.intent;
			return (intent && intent.getStringExtra("test_grep")) || null;
		}
		return Ti.App.Properties.getString("test_grep") || null;
	} catch (e) {
		return null;
	}
}

// Keep the watchdog from backgrounding us mid-capture (iOS kills within ~10s).
Ti.App.idleTimerDisabled = true;

var manifest = require("spec/visual/manifest");
var capture = require("spec/visual/captureScreens");

var window = Ti.UI.createWindow({ backgroundColor: "black", orientationModes: [capture.CAPTURE_LANDSCAPE] });
window.addEventListener("open", function () {
	capture.captureAll(manifest, { grep: readGrep() })
		.then(function (results) {
			// dir tells the host where to pull the PNGs from — the Android app
			// data dir isn't adb-pullable by a fixed path the way the iOS
			// simulator container is.
			Ti.API.info("VISUAL_CAPTURE_DONE count=" + results.length + " dir=" + capture.outputDir().nativePath);
		})
		.catch(function (err) {
			Ti.API.error("VISUAL_CAPTURE_FAILED " + (err && err.message ? err.message : err));
		});
});
window.open();
