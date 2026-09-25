import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import screenMetrics from "../../walta-app/app/lib/util/screenMetrics.js";

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

// Which declared legs render each size band, keyed by band name. A band with an
// empty list is a set of `[if=Alloy.Globals.<band>]` rules nothing in CI ever
// renders and no baseline ever covers — the gap the visual suite is blind in.
//
// A leg's declared screen is the landscape dp the bands are compared against, not
// the device's advertised resolution: displayCaps reports points on iOS but pixels
// on Android, so only the device can measure it (each run reports what it
// measured, and the declaration is checked against it).
export function bandCoverage(devices = readDevices()) {
    // Every band is a key from the start, so a band nothing renders reads as an
    // empty list rather than a missing one.
    const coverage = Object.fromEntries(screenMetrics.BANDS.map((band) => [band, []]));
    for (const platform of Object.keys(devices).sort()) {
        for (const device of devices[platform]) {
            if (!device.screen) continue;
            const inBand = screenMetrics.bands({ relWidth: device.screen.width, relHeight: device.screen.height });
            for (const band of screenMetrics.BANDS) {
                if (inBand[band]) coverage[band].push(`${platform}/${device.label}`);
            }
        }
    }
    return coverage;
}

// The screen one leg is declared to render on, for checking against what it
// actually rendered on.
export function declaredScreenFor(devices, platform, label) {
    const device = (devices[platform] || []).find((d) => d.label === label);
    return device && device.screen;
}
