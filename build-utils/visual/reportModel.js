// Reshapes one compareRun result per capture run into a screen × run matrix —
// the shape the HTML report renders as a gallery with one row per screen and one
// column per platform/device, so the whole matrix can be scanned side by side.
//
// A screen missing from a run is "absent" rather than dropped: a screen that only
// some legs captured is a coverage gap a reviewer should see, not silently hide.
//
// Image paths are relative to the report file, which sits at the root of the
// captures tree (builds/visual/) — so the report and the PNGs it points at travel
// together as one CI artifact.

const STATUSES = ["pass", "fail", "new", "missing", "updated", "absent"];

// Which of the three images a status actually has on disk. A status with no
// baseline can't show one, and only a mismatch has a diff image written for it.
const HAS_BASELINE = new Set(["pass", "fail", "missing", "updated"]);
const HAS_ACTUAL = new Set(["pass", "fail", "new", "updated"]);

function cellImages({ platform, device }, name, status) {
    const images = {};
    if (HAS_BASELINE.has(status)) images.baseline = `${platform}/${device}/baseline/${name}.png`;
    if (HAS_ACTUAL.has(status)) images.actual = `${platform}/${device}/actual/${name}.png`;
    if (status === "fail") images.diff = `${platform}/${device}/report/${name}.diff.png`;
    return images;
}

function summarise(screens) {
    const summary = { total: 0 };
    for (const status of STATUSES) summary[status] = 0;
    for (const screen of screens) {
        for (const cell of screen.cells) {
            summary.total += 1;
            summary[cell.status] += 1;
        }
    }
    return summary;
}

export function buildReportModel(runs) {
    const names = [...new Set(runs.flatMap((r) => r.results.map((s) => s.name)))].sort();
    const screens = names.map((name) => ({
        name,
        cells: runs.map((run) => {
            const result = run.results.find((s) => s.name === name) || { status: "absent" };
            return { ...result, name, runId: `${run.platform}/${run.device}`, images: cellImages(run, name, result.status) };
        }),
    }));
    return {
        runs: runs.map(({ platform, device, deviceName, capturedAt }) =>
            ({ platform, device, deviceName, capturedAt, id: `${platform}/${device}` })),
        screens,
        summary: summarise(screens),
    };
}
