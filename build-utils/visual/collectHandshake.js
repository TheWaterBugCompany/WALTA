import path from "path";
import { parseReadyMarker, rotationFor } from "./orientation.js";

// Drives file-handshake visual capture: polls the app's visual dir for per-screen
// <name>.ready markers the runner writes, screenshots each framebuffer on the
// spot, acks with a <name>.shot the runner is waiting on, and returns once the
// runner writes the capture-done sentinel. Unlike watching the device log for
// VISUAL_FRAMEBUFFER_READY / VISUAL_CAPTURE_DONE, this has no log dependence — so
// simctl/logcat dropping or batching lines under load can't stall the capture
// (the 600s iOS timeout) or make the host screenshot the wrong screen.
const DONE = "capture-done";

export async function collectHandshake({ launcher, appId, actualDir, timeoutMs, pollMs = 200, now, sleep, log }) {
    const clock = now || (() => Date.now());
    const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    const note = log || (() => {});
    const shot = new Set();
    const deadline = clock() + timeoutMs;

    for (;;) {
        // Listing can throw transiently — the app dir / simctl get_app_container
        // isn't ready the instant the runner boots. Treat it as "nothing yet" and
        // poll again rather than failing the whole capture (the 600s deadline is
        // the real backstop).
        let files = [];
        try {
            files = await launcher.listVisualCaptureFiles(appId);
        } catch (e) {
            note(`  visual: listing not ready yet (${e && e.message ? e.message : e})`);
        }
        // Grab every screen that signalled ready and we haven't yet — before the
        // done check, so a screen whose .ready lands in the same poll as the
        // sentinel is still captured. A single screenshot/ack hiccup (contended
        // simctl/adb) leaves the screen unshot to retry next poll, rather than
        // killing the run — matching the old per-screen tolerance.
        for (const f of files) {
            const marker = parseReadyMarker(f);
            if (!marker || shot.has(marker.name)) continue;
            const { name, orientation } = marker;
            try {
                await launcher.screenshotFramebuffer(path.join(actualDir, `${name}.png`), { orientation });
                await launcher.writeVisualCaptureFile(appId, `${name}.shot`);
                shot.add(name);
            } catch (e) {
                note(`  visual: ${name} shot failed, will retry (${e && e.message ? e.message : e})`);
            }
        }
        if (files.includes(DONE)) return { count: shot.size };
        if (clock() >= deadline) {
            throw new Error(`visual capture timed out after ${Math.round(timeoutMs / 1000)}s with no ${DONE} (captured ${shot.size})`);
        }
        await wait(pollMs);
    }
}
