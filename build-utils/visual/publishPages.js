#!/usr/bin/env node
// Publishes one visual run's gallery into a gh-pages checkout: drops the
// capture tree under the run's own id, prunes the oldest runs, and rewrites the
// index. The caller owns the git side — this only shapes the directory.
//
// Usage: publishPages.js <siteDir> <captureDir> <runId> <branch> <sha> <capturedAt> [limit]

import fs from "fs";
import path from "path";
import { retainedRuns, renderIndex } from "./pagesSite.js";

const MANIFEST = "runs.json";
const DEFAULT_LIMIT = 10;

function readRuns(siteDir) {
    try {
        return JSON.parse(fs.readFileSync(path.join(siteDir, MANIFEST), "utf8"));
    } catch (_) {
        // No manifest yet (first publish), or one we can't parse — either way the
        // directories on disk are the truth and a fresh manifest is rebuilt below.
        return [];
    }
}

export function publish({ siteDir, captureDir, run, limit = DEFAULT_LIMIT }) {
    fs.mkdirSync(siteDir, { recursive: true });
    fs.cpSync(captureDir, path.join(siteDir, run.id), { recursive: true });

    const kept = retainedRuns(readRuns(siteDir), run, limit);
    const keptIds = new Set(kept.map((r) => r.id));
    for (const entry of fs.readdirSync(siteDir, { withFileTypes: true })) {
        if (entry.isDirectory() && !keptIds.has(entry.name)) {
            fs.rmSync(path.join(siteDir, entry.name), { recursive: true, force: true });
        }
    }

    fs.writeFileSync(path.join(siteDir, MANIFEST), JSON.stringify(kept, null, 2));
    fs.writeFileSync(path.join(siteDir, "index.html"), renderIndex(kept));
    // Pages runs everything through Jekyll otherwise, which drops directories
    // whose names begin with an underscore and rewrites nothing else usefully.
    fs.writeFileSync(path.join(siteDir, ".nojekyll"), "");
    return kept;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const [siteDir, captureDir, id, branch, sha, capturedAt, limit] = process.argv.slice(2);
    const kept = publish({
        siteDir, captureDir,
        run: { id, branch, sha, capturedAt },
        limit: limit ? Number(limit) : DEFAULT_LIMIT,
    });
    console.log(`published ${id}; site now holds ${kept.length} run(s): ${kept.map((r) => r.id).join(", ")}`);
}
