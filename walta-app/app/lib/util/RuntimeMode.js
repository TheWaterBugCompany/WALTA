// Reads runtime launch arguments to decide which entry point the
// dispatcher in `app/controllers/index.js` should hand off to. See
// WB-25.
//
// `ti` is injected so the helper is unit-testable in node — the
// dispatcher passes the global `Ti` at call time. Launch-arg
// conventions mirror those used by `app/spec/index.js` for
// `test_grep` / `test_manual` (Android intent extras, iOS argv
// merged into NSUserDefaults via Ti.App.Properties).

function readBooleanArg(ti, name) {
    try {
        if (ti.Platform.osname === "android") {
            var intent = ti.Android.currentActivity && ti.Android.currentActivity.intent;
            return !!(intent && intent.getBooleanExtra(name, false));
        }
        var raw = ti.App.Properties.getString(name);
        return raw === "true" || raw === "1";
    } catch (e) {
        return false;
    }
}

function isUnitTestRun(ti) {
    return readBooleanArg(ti, "unit_test");
}

// Routes to the on-device visual-regression capture runner (VisualCapture.js)
// instead of the mocha runner or the real app.
function isVisualCaptureRun(ti) {
    return readBooleanArg(ti, "visual_capture");
}

exports.isUnitTestRun = isUnitTestRun;
exports.isVisualCaptureRun = isVisualCaptureRun;
