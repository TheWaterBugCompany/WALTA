import path from "path";

// Drives file-handshake visual capture: polls the app's visual dir for per-screen
// <name>.ready markers the runner writes, screenshots each framebuffer on the
// spot, acks with a <name>.shot the runner is waiting on, and returns once the
// runner writes the capture-done sentinel. Unlike watching the device log for
// VISUAL_FRAMEBUFFER_READY / VISUAL_CAPTURE_DONE, this has no log dependence — so
// simctl/logcat dropping or batching lines under load can't stall the capture
// (the 600s iOS timeout) or make the host screenshot the wrong screen.
const DONE = "capture-done";

export async function collectHandshake({ launcher, appId, actualDir, timeoutMs, pollMs = 200, now, sleep }) {
    const clock = now || (() => Date.now());
    const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    const shot = new Set();
    const deadline = clock() + timeoutMs;

    for (;;) {
        const files = await launcher.listVisualCaptureFiles(appId);
        // Grab every screen that signalled ready and we haven't yet — before the
        // done check, so a screen whose .ready lands in the same poll as the
        // sentinel is still captured.
        for (const f of files) {
            const m = /^(.+)\.ready$/.exec(f);
            if (!m || shot.has(m[1])) continue;
            const name = m[1];
            await launcher.screenshotFramebuffer(path.join(actualDir, `${name}.png`));
            await launcher.writeVisualCaptureFile(appId, `${name}.shot`);
            shot.add(name);
        }
        if (files.includes(DONE)) return { count: shot.size };
        if (clock() >= deadline) {
            throw new Error(`visual capture timed out after ${Math.round(timeoutMs / 1000)}s with no ${DONE} (captured ${shot.size})`);
        }
        await wait(pollMs);
    }
}
