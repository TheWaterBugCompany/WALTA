import fs from "fs";
import path from "path";

// Finds the capture runs sitting under a captures root (builds/visual/), each
// identified by the results.json visual-collect writes beside its diff images.
// Locally that's every device captured so far; in CI it's the matrix legs'
// artifacts unpacked into one tree — the same scan builds the report either way.

const RESULTS_FILE = "results.json";

function subdirs(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
}

export function collectRuns(root) {
    const runs = [];
    for (const platform of subdirs(root)) {
        for (const device of subdirs(path.join(root, platform))) {
            const file = path.join(root, platform, device, "report", RESULTS_FILE);
            if (!fs.existsSync(file)) continue;
            runs.push(JSON.parse(fs.readFileSync(file, "utf8")));
        }
    }
    return runs;
}

export { RESULTS_FILE };
