// Entry-point dispatcher. The real app and the on-device test runner
// are both bundled into every dev/CI build; this file picks one at
// startup based on a runtime launch arg. See WB-25.
//
// - Production launch (no flag): `index-app` — the user-facing app.
// - Test launch (`-unit_test true` on iOS / `--ez unit_test true` on
//   Android): `UnitTest` — the on-device mocha runner.
// - Visual capture (`-visual_capture true` / `--ez visual_capture true`):
//   `VisualCapture` — the on-device visual-regression screenshot runner.
//
// `Ti` is read here and handed to RuntimeMode so the helper itself
// stays node-testable.
var RuntimeMode = require("util/RuntimeMode");

if (RuntimeMode.isVisualCaptureRun(Ti)) {
    Alloy.createController("VisualCapture");
} else if (RuntimeMode.isUnitTestRun(Ti)) {
    Alloy.createController("UnitTest");
} else {
    Alloy.createController("index-app");
}
