// Parses a single line of device log output and returns the on-device
// mocha runner's result marker, or null if the line carries no marker.
// The grunt `output-logs` task uses this to decide whether to fail the
// build on `UNIT_TESTS_FAILED`. See WB-48.
export function parseUnitTestResult(line) {
    if (/UNIT_TESTS_FAILED/.test(line)) return "failed";
    if (/UNIT_TESTS_PASSED/.test(line)) return "passed";
    return null;
}
