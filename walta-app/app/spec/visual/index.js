// On-device visual-regression capture runner — the visual twin of spec/index.js.
// Reached only when index.js dispatches on the `visual_capture` launch arg. Opens
// a black window, captures every manifest screen to
// applicationDataDirectory/visual/, and prints host-parseable markers so the
// grunt visual-test task knows when to pull the PNGs.
//
//   VISUAL_CAPTURE_DONE count=<n>   — all screens captured
//   VISUAL_CAPTURE_FAILED <message> — capture threw
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

var window = Ti.UI.createWindow({ backgroundColor: "black" });
window.addEventListener("open", function () {
	capture.captureAll(manifest, { grep: readGrep() })
		.then(function (results) {
			Ti.API.info("VISUAL_CAPTURE_DONE count=" + results.length);
		})
		.catch(function (err) {
			Ti.API.error("VISUAL_CAPTURE_FAILED " + (err && err.message ? err.message : err));
		});
});
window.open();
