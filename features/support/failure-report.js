'use strict';

// Renders a failed cucumber scenario as a readable report: the ordered steps
// with pass/fail markers plus the error message. Written into the per-scenario
// CI diagnostics dir (failure-diagnostics.js) so a failing run names the exact
// step that broke, instead of leaving it to be inferred from the cumulative,
// multi-scenario device/mock logs.

const MARKERS = {
    PASSED: "✓",   // ✓
    FAILED: "✗",   // ✗
    SKIPPED: "·",  // ·
};

function stepLine({ text, status }) {
    const marker = MARKERS[status] || "?";
    const suffix = status === "FAILED" ? "  <-- FAILED" : "";
    return `  ${marker} ${text}${suffix}`;
}

function formatFailureReport({ scenarioName, steps = [], message = "" }) {
    return [
        `Scenario: ${scenarioName}`,
        "",
        "Steps:",
        ...steps.map(stepLine),
        "",
        "Error:",
        message,
        "",
    ].join("\n");
}

exports.formatFailureReport = formatFailureReport;
