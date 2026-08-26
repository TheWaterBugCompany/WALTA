import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// The devices CI captures on, declared once. The workflow builds its iOS and
// Android job matrices from this, and the report reads it to know which columns
// to expect — so a leg that dies before capturing anything shows as a column of
// gaps rather than silently vanishing from a report that then looks complete.
//
// It lives next to the baselines because that is what a device entry really
// identifies: one renderer-specific baseline set.
const DEVICES_FILE = path.join(
    path.dirname(fileURLToPath(import.meta.url)), "..", "..", "visual", "devices.json");

export function readDevices(file = DEVICES_FILE) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function expectedRuns(devices = readDevices()) {
    return Object.keys(devices).sort().flatMap((platform) =>
        devices[platform].map((d) => ({ platform, device: d.label })));
}

export function matrixFor(devices, platform) {
    return devices[platform];
}
