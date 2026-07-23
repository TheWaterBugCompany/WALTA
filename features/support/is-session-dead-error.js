'use strict';

// True when an error means the Appium/WDA session itself has collapsed — as
// opposed to an element that isn't on screen yet, or a genuine assertion.
// Contended CI runners drop the session mid-scenario (WB-149/WB-200); this is
// the signal the harness keys off to fail fast and classify the failure as
// infra rather than a real test failure.
const DEAD_SESSION_PATTERNS = [
    /session is either terminated or not started/i,
    /invalid session id/i,
];

module.exports = function isSessionDeadError(err) {
    if (!err) return false;
    const message = typeof err === "string" ? err : err.message || "";
    return DEAD_SESSION_PATTERNS.some(re => re.test(message));
};
