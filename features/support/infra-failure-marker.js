'use strict';

// The contract between the cucumber After hook (which emits a marker when a
// scenario fails for an infrastructure reason) and CucumberLauncher (which
// reads the markers to decide how to re-run). Kept in one place so the two
// sides can't drift.
//
// Each marker carries a `reason` so the launcher can pick the right recovery:
//   - "session-dead"   — a contended runner dropped the Appium/WDA session;
//                        a fresh session (cheap in-process re-run) fixes it.
//   - "environmental"  — an emulator/CI-environment flake (e.g. a slow GPS
//                        fix); only a FRESH DEVICE fixes it, so the launcher
//                        escalates to EX_TEMPFAIL for a CI-shell retry.
const PREFIX = "[infra-failure] ";
const SEP = " :: ";

function markerLine(scenarioName, reason) {
    return `${PREFIX}${reason}${SEP}${scenarioName}`;
}

function parseInfraFailures(output) {
    return output.split("\n")
        .map(line => {
            const at = line.indexOf(PREFIX);
            if (at === -1) return null;
            const rest = line.slice(at + PREFIX.length);
            const sep = rest.indexOf(SEP);
            if (sep === -1) return null;
            return { reason: rest.slice(0, sep).trim(), name: rest.slice(sep + SEP.length).trim() };
        })
        .filter(Boolean);
}

module.exports = { markerLine, parseInfraFailures };
