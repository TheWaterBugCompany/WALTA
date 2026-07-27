// Parses a single line of device log output for the on-device visual-capture
// runner's completion markers, or null if the line carries none. The grunt
// visual-test task uses this to know when every screen has been captured (so it
// can pull the PNGs) or that capture threw.
//
//   VISUAL_CAPTURE_DONE count=<n> [dir=<path>] → { status: "done", count, dir }
//   VISUAL_CAPTURE_FAILED <message>            → { status: "failed", message }
export function parseVisualCaptureResult(line) {
    const done = /VISUAL_CAPTURE_DONE count=(\d+)(?: dir=(\S+))?/.exec(line);
    if (done) return { status: "done", count: Number(done[1]), dir: done[2] || null };
    const failed = /VISUAL_CAPTURE_FAILED (.+)$/.exec(line);
    if (failed) return { status: "failed", message: failed[1].trim() };
    return null;
}
