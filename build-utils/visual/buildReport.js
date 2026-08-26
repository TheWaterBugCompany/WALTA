import fs from "fs";
import path from "path";
import { collectRuns } from "./collectRuns.js";
import { buildReportModel } from "./reportModel.js";
import { renderReport } from "./renderReport.js";

// Writes the review page at the root of the captures tree, covering every run
// found under it. Locally that grows as you capture more devices; in CI the
// aggregate job unpacks each matrix leg's artifact into one tree first, so the
// same call produces the whole-matrix gallery.
//
// A run that captured nothing still gets a page saying so, rather than no file:
// a silently absent report reads as "nothing to review" when it means "the
// capture never ran", and the page also pins the root of the CI artifact so the
// legs merge back into one tree with their platform/device paths intact.

const REPORT_FILE = "report.html";

export function buildReport({ root, title, generatedAt, expected = [] } = {}) {
    const captured = collectRuns(root);
    const missingRuns = expected
        .filter((e) => !captured.some((r) => r.platform === e.platform && r.device === e.device))
        .map((e) => `${e.platform}/${e.device}`);
    const runs = withDeclaredButUncaptured(captured, expected);

    const model = buildReportModel(runs);
    fs.mkdirSync(root, { recursive: true });
    const file = path.join(root, REPORT_FILE);
    fs.writeFileSync(file, renderReport(model, { title, generatedAt }));
    return { runs: model.runs.length, screens: model.screens.length, missingRuns, file, summary: model.summary };
}

// A leg that dies before capturing anything uploads no results, and its column
// would simply vanish — leaving a report that looks complete. Declared devices
// are therefore always columns; one with no run of its own is an empty column,
// which reads as the gap it is. A run nobody declared is still shown: a local
// capture on an undeclared simulator is worth seeing, not hiding.
function withDeclaredButUncaptured(captured, expected) {
    const runs = [...captured];
    for (const device of expected) {
        if (runs.some((r) => r.platform === device.platform && r.device === device.device)) continue;
        runs.push({ ...device, results: [], uncaptured: true });
    }
    return runs.sort((a, b) => `${a.platform}/${a.device}`.localeCompare(`${b.platform}/${b.device}`));
}
