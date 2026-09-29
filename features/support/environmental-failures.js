'use strict';

// Failure messages from waits that depend on the health of the emulator / CI
// environment rather than on product correctness. When one of these is the
// *only* reason a scenario failed (and the Appium session is still alive), the
// After hook marks it as an "environmental" infra failure so CucumberLauncher
// re-runs it once on a FRESH DEVICE (a fresh Appium session can't cure emulator
// state like a slow-to-converge GPS fix). This never masks a real defect: a
// deterministic failure fails the fresh-device retry too, and any non-infra
// failure alongside keeps the whole run red (see CucumberLauncher.run).
//
// Each constant is the drift-proof source of truth for its wait's timeoutMsg —
// the wait imports it, so the message and the classifier can't fall out of sync.
const GPS_LOCK_NOT_OBTAINED = "GPS lock not obtained on Site Details";
const SAMPLE_TRAY_TILE_MISSING = "Sample tray is missing tile";
// The iOS photo picker is hosted out of process. When that service stalls the
// app is left showing a blank sheet with a spinner and the grid never enters
// the accessibility tree — the app asked correctly and has no part in it.
const IOS_PHOTO_PICKER_NOT_PRESENTED = "iOS photo picker grid did not appear";

const ENVIRONMENTAL_FAILURE_MESSAGES = [
    GPS_LOCK_NOT_OBTAINED,
    SAMPLE_TRAY_TILE_MISSING,
    IOS_PHOTO_PICKER_NOT_PRESENTED,
];

function isEnvironmentalFailure(message) {
    return !!message && ENVIRONMENTAL_FAILURE_MESSAGES.some(m => message.includes(m));
}

module.exports = {
    GPS_LOCK_NOT_OBTAINED,
    SAMPLE_TRAY_TILE_MISSING,
    IOS_PHOTO_PICKER_NOT_PRESENTED,
    ENVIRONMENTAL_FAILURE_MESSAGES,
    isEnvironmentalFailure,
};
