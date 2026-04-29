// Reads runtime launch arguments to decide which entry point the
// dispatcher in `app/controllers/index.js` should hand off to. See
// WB-25.
//
// `ti` is injected so the helper is unit-testable in node — the
// dispatcher passes the global `Ti` at call time. Launch-arg
// conventions mirror those used by `app/spec/index.js` for
// `test_grep` / `test_manual` (Android intent extras, iOS argv
// merged into NSUserDefaults via Ti.App.Properties).

function isUnitTestRun(ti) {
    try {
        if (ti.Platform.osname === "android") {
            var intent = ti.Android.currentActivity && ti.Android.currentActivity.intent;
            return !!(intent && intent.getBooleanExtra("unit_test", false));
        }
        var raw = ti.App.Properties.getString("unit_test");
        return raw === "true" || raw === "1";
    } catch (e) {
        return false;
    }
}

exports.isUnitTestRun = isUnitTestRun;
