'use strict';

const { isEnvironmentalFailure } = require('./environmental-failures');

// Decide whether a FAILED scenario failed for an infrastructure reason and, if
// so, which recovery it needs — so the After hook can emit the right marker for
// CucumberLauncher (see infra-failure-marker.js):
//   "environmental" — only a FRESH DEVICE (rebooted emulator/sim) can cure it.
//   "session-dead"  — a dropped Appium session; a cheap in-process fresh session
//                     on the SAME device is enough.
//   null            — a genuine defect: stays red, never retried.
//
// A failure while the Before hook hadn't completed means the app never became
// ready to test — pure infrastructure (a slow/wedged cold launch on a contended
// runner). A fresh session on the same device can't cure that, so it must route
// to the fresh-device retry regardless of whether the session momentarily looks
// alive. Missing this is what let the flake through: such a failure fell through
// every branch, was left unmarked, and one unmarked failure makes
// infra.length !== failedCount in CucumberLauncher, skipping the whole retry.
async function classifyInfraFailure({ beforeHookCompleted, message, sessionAlive }) {
    if (!beforeHookCompleted) return "environmental";
    if (!(await sessionAlive())) return "session-dead";
    if (isEnvironmentalFailure(message)) return "environmental";
    return null;
}

module.exports = { classifyInfraFailure };
