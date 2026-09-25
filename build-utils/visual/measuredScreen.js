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

export { SCREEN_FILE };
