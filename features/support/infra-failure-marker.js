'use strict';

// The contract between the cucumber After hook (which emits a marker when a
// scenario fails with a dead session) and CucumberLauncher (which reads the
// markers to decide which failures were infra and re-runs only those). Kept in
// one place so the two sides can't drift.
const PREFIX = "[infra-failure] session-dead :: ";

function markerLine(scenarioName) {
    return PREFIX + scenarioName;
}

function parseInfraFailures(output) {
    return output.split("\n")
        .filter(line => line.includes(PREFIX))
        .map(line => line.slice(line.indexOf(PREFIX) + PREFIX.length).trim());
}

module.exports = { markerLine, parseInfraFailures };
