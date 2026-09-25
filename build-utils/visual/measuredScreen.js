import fs from "fs";
import path from "path";

// What screenMetrics made of the display the run actually rendered on, reported by
// the runner alongside its captures. The host reads it out of the captures tree and
// into the run record, so a leg says which size band it exercised rather than being
// assumed to.
const SCREEN_FILE = "screen.json";

export function readMeasuredScreen(dir) {
    const file = path.join(dir, SCREEN_FILE);
    if (!fs.existsSync(file)) return null;
    const screen = JSON.parse(fs.readFileSync(file, "utf8"));
    fs.rmSync(file);
    return screen;
}

// Whether what the device rendered on is the screen visual/devices.json says that
// leg renders on. The declaration is what the band-coverage guard reasons about,
// so a declaration that has drifted makes the guard's answer wrong while it still
// reads as green — and only the device can measure the figure to check it against.
//
// Rounded to whole dp: a declaration is written in them, and a density that does
// not divide the pixel count evenly gives the device a fraction.
export function screenMismatch(measured, declared) {
    if (!measured || !declared) return null;
    const asDp = (width, height) => `${Math.round(width)}x${Math.round(height)}dp`;
    const measuredDp = asDp(measured.relWidth, measured.relHeight);
    const declaredDp = asDp(declared.width, declared.height);
    return measuredDp === declaredDp ? null : { measured: measuredDp, declared: declaredDp };
}

export { SCREEN_FILE };
