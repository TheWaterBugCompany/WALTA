import fs from "fs";
import path from "path";
import { RESULTS_FILE } from "./collectRuns.js";

// Leaves a run's directory self-describing and self-contained: the compare
// results the report builder reads back, and a copy of the baselines the report
// links to. The baselines live outside the captures tree (they're committed), so
// without the copy a downloaded CI artifact would show captures with nothing to
// compare them against.

export function persistRun({ platform, device, deviceName, deviceDir, baselineDir, results, capturedAt }) {
    copyBaselines(baselineDir, path.join(deviceDir, "baseline"));
    const reportDir = path.join(deviceDir, "report");
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
        path.join(reportDir, RESULTS_FILE),
        JSON.stringify({ platform, device, deviceName, capturedAt, results }, null, 2),
    );
}

function copyBaselines(from, to) {
    fs.rmSync(to, { recursive: true, force: true });
    if (!fs.existsSync(from)) return;
    fs.mkdirSync(to, { recursive: true });
    for (const file of fs.readdirSync(from).filter((f) => f.endsWith(".png"))) {
        fs.copyFileSync(path.join(from, file), path.join(to, file));
    }
}
