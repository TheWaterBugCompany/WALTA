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

export function buildReport({ root, title, generatedAt } = {}) {
    const runs = collectRuns(root);
    const model = buildReportModel(runs);
    fs.mkdirSync(root, { recursive: true });
    const file = path.join(root, REPORT_FILE);
    fs.writeFileSync(file, renderReport(model, { title, generatedAt }));
    return { runs: model.runs.length, screens: model.screens.length, file, summary: model.summary };
}
