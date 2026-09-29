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
// A field that never took keyboard focus receives none of what XCUITest types,
// and the driver reports the write as a success. Nothing in the app takes part:
// the tap that would have focused it was swallowed by the device.
const FIELD_DID_NOT_TAKE_TEXT = "field did not take the text typed into it";

const ENVIRONMENTAL_FAILURE_MESSAGES = [
    GPS_LOCK_NOT_OBTAINED,
    SAMPLE_TRAY_TILE_MISSING,
    IOS_PHOTO_PICKER_NOT_PRESENTED,
    FIELD_DID_NOT_TAKE_TEXT,
];

function isEnvironmentalFailure(message) {
    return !!message && ENVIRONMENTAL_FAILURE_MESSAGES.some(m => message.includes(m));
}

module.exports = {
    GPS_LOCK_NOT_OBTAINED,
    SAMPLE_TRAY_TILE_MISSING,
    IOS_PHOTO_PICKER_NOT_PRESENTED,
    FIELD_DID_NOT_TAKE_TEXT,
    ENVIRONMENTAL_FAILURE_MESSAGES,
    isEnvironmentalFailure,
};
