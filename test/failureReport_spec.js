require("mocha");
const { expect } = require("chai");
const { formatFailureReport } = require("../features/support/failure-report");

describe("formatFailureReport", function () {
    const steps = [
        { text: "I am logged in", status: "PASSED" },
        { text: "the GPS has a fix", status: "PASSED" },
        { text: "I open the sample history and tap Sync", status: "FAILED" },
        { text: "the sync completes", status: "SKIPPED" },
    ];
    const message = "Error: element (~Sync) still displayed after 60000ms";

    it("names the scenario", function () {
        const report = formatFailureReport({ scenarioName: "User initiates sync", steps, message });
        expect(report).to.contain("User initiates sync");
    });

    it("marks the failed step so it is identifiable at a glance", function () {
        const report = formatFailureReport({ scenarioName: "S", steps, message });
        const failedLine = report.split("\n").find(l => l.includes("tap Sync"));
        expect(failedLine, "failed step line").to.match(/FAILED/);
    });

    it("includes the full error message", function () {
        const report = formatFailureReport({ scenarioName: "S", steps, message });
        expect(report).to.contain(message);
    });

    it("shows passed steps without marking them failed", function () {
        const report = formatFailureReport({ scenarioName: "S", steps, message });
        const gpsLine = report.split("\n").find(l => l.includes("the GPS has a fix"));
        expect(gpsLine, "passed step line").to.not.match(/FAILED/);
    });
});
