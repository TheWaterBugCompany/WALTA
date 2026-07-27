import fs from "fs";
import path from "path";
import { compareScreenshots } from "./compareScreenshots.js";

// Compares a directory of captured screenshots against committed baselines and
// returns a structured result per screen. Writes a diff image for each mismatch
// so CI can attach a baseline/actual/diff artifact. With `update`, captures are
// copied over the baselines instead (the "accept the new look" path — commit the
// refreshed baselines in the same PR).
//
// A screen with no baseline is "new" and a baseline with no capture is "missing";
// both are failures (advisory), because either is something a reviewer should
// look at rather than silently ignore.

function pngNames(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter((f) => f.endsWith(".png"))
        .map((f) => f.slice(0, -".png".length));
}

export async function compareRun({ baselineDir, actualDir, outDir, threshold, failRatio, update = false } = {}) {
    fs.mkdirSync(outDir, { recursive: true });
    if (update) fs.mkdirSync(baselineDir, { recursive: true });

    const names = [...new Set([...pngNames(baselineDir), ...pngNames(actualDir)])].sort();
    const results = [];

    for (const name of names) {
        const baselinePath = path.join(baselineDir, `${name}.png`);
        const actualPath = path.join(actualDir, `${name}.png`);
        const hasBaseline = fs.existsSync(baselinePath);
        const hasActual = fs.existsSync(actualPath);

        if (update) {
            if (hasActual) {
                fs.copyFileSync(actualPath, baselinePath);
                results.push({ name, status: "updated" });
            } else {
                results.push({ name, status: "missing" });
            }
            continue;
        }

        if (!hasActual) { results.push({ name, status: "missing" }); continue; }
        if (!hasBaseline) { results.push({ name, status: "new" }); continue; }

        const comparison = await compareScreenshots(
            fs.readFileSync(baselinePath),
            fs.readFileSync(actualPath),
            { threshold, failRatio },
        );
        if (comparison.pass) {
            results.push({ name, status: "pass", diffRatio: comparison.diffRatio, diffPixels: comparison.diffPixels });
        } else {
            let diffImagePath;
            if (comparison.diffImage) {
                diffImagePath = path.join(outDir, `${name}.diff.png`);
                fs.writeFileSync(diffImagePath, comparison.diffImage);
            }
            results.push({
                name,
                status: "fail",
                diffRatio: comparison.diffRatio,
                diffPixels: comparison.diffPixels,
                dimensionsMatch: comparison.dimensionsMatch,
                diffImagePath,
            });
        }
    }

    const pass = results.every((r) => r.status === "pass" || r.status === "updated");
    return { pass, results };
}
