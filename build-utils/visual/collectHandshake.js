import path from "path";
import { looksBlank as frameLooksBlank } from "./blankFrame.js";

// Drives file-handshake visual capture: polls the app's visual dir for per-screen
// <name>.ready markers the runner writes, screenshots each framebuffer on the
// spot, acks with a <name>.shot the runner is waiting on, and returns once the
// runner writes the capture-done sentinel. Unlike watching the device log for
// VISUAL_FRAMEBUFFER_READY / VISUAL_CAPTURE_DONE, this has no log dependence — so
// simctl/logcat dropping or batching lines under load can't stall the capture
// (the 600s iOS timeout) or make the host screenshot the wrong screen.
const DONE = "capture-done";

// The runner opens no screen until it can see this. Rewritten on every poll
// rather than once, so the runner wiping the dir at the start of a run — which
// it does before its first screen — can't strand it waiting for a marker that
// was written and then deleted.
const COLLECTOR_READY = "collector-ready";

// How many times to re-grab a screen that comes back blank. The runner holds the
// screen until we ack it, so a re-grab sees the same screen rather than the next
// one — this is waiting for a frame to arrive, not retrying the screen.
const BLANK_ATTEMPTS = 3;

// How many times to re-grab a screen the OS is showing something else over. A
// toast or a transition clears well inside this; an ANR dialog never does, and
// waiting out the 600s capture timeout would report the wrong cause.
const OBSCURED_ATTEMPTS = 25;

// The window the OS has focused, when it belongs to something other than the app
// under capture. Launchers that can't answer (iOS has no equivalent of dumpsys)
// leave the check off rather than guessing.
async function foreignWindow(launcher, appId) {
    if (!launcher.foregroundWindow) return null;
    const focused = await launcher.foregroundWindow();
    return focused && !focused.includes(appId) ? focused : null;
}

export async function collectHandshake({ launcher, appId, actualDir, timeoutMs, pollMs = 200, now, sleep, log,
    looksBlank = frameLooksBlank, blankAttempts = BLANK_ATTEMPTS, obscuredAttempts = OBSCURED_ATTEMPTS }) {
    const clock = now || (() => Date.now());
    const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    const note = log || (() => {});
    const shot = new Set();
    const blank = [];
    const attempts = new Map();
    const obscured = new Map();
    const deadline = clock() + timeoutMs;
    let reachable = null;

    for (;;) {
        // Reaching the container can throw transiently — the app dir / simctl
        // get_app_container isn't ready the instant the runner boots. Treat it as
        // "not yet" and poll again rather than failing the whole capture (the 600s
        // deadline is the real backstop). The runner is waiting on our marker, so
        // it holds its first screen until we get through.
        let files = [];
        try {
            await launcher.writeVisualCaptureFile(appId, COLLECTOR_READY);
            files = await launcher.listVisualCaptureFiles(appId);
            if (reachable === false) { note("  visual: app container reachable, collecting"); }
            reachable = true;
        } catch (e) {
            // Noted on the transition, not every poll: a run that spends a minute
            // waiting for the container is the condition that used to corrupt the
            // first screens silently, and it should say so exactly once.
            if (reachable !== false) {
                note(`  visual: waiting for the app container (${e && e.message ? e.message : e})`);
            }
            reachable = false;
        }
        // Grab every screen that signalled ready and we haven't yet — before the
        // done check, so a screen whose .ready lands in the same poll as the
        // sentinel is still captured. A single screenshot/ack hiccup (contended
        // simctl/adb) leaves the screen unshot to retry next poll, rather than
        // killing the run — matching the old per-screen tolerance.
        let aborted = null;
        for (const f of files) {
            const m = /^(.+)\.ready$/.exec(f);
            if (!m || shot.has(m[1])) continue;
            const name = m[1];
            try {
                const file = path.join(actualDir, `${name}.png`);
                await launcher.screenshotFramebuffer(file);
                // The framebuffer holds whatever the OS composited, our app or not.
                // A system dialog over the screen makes a well-drawn frame of the
                // wrong thing, which every later check passes — so ask what the OS
                // has focused and grab again rather than ack it.
                const intruder = await foreignWindow(launcher, appId);
                if (intruder) {
                    const seen = (obscured.get(name) || 0) + 1;
                    obscured.set(name, seen);
                    if (seen >= obscuredAttempts) {
                        aborted = `${name} was shot behind another window ${seen} times — ${intruder}`;
                        break;
                    }
                    note(`  visual: ${name} was shot behind ${intruder}, grabbing again`);
                    continue;
                }
                // A frame with nothing drawn on it isn't a capture of the screen —
                // the app is still holding it, so grab again rather than ack a
                // blank that would go on to be blessed as a baseline.
                const tries = (attempts.get(name) || 0) + 1;
                attempts.set(name, tries);
                if (await looksBlank(file)) {
                    if (tries < blankAttempts) {
                        note(`  visual: ${name} came back blank, grabbing again`);
                        continue;
                    }
                    note(`  visual: ${name} still blank after ${tries} grabs — keeping the empty frame`);
                    blank.push(name);
                }
                await launcher.writeVisualCaptureFile(appId, `${name}.shot`);
                shot.add(name);
            } catch (e) {
                note(`  visual: ${name} shot failed, will retry (${e && e.message ? e.message : e})`);
            }
        }
        // Raised out here rather than in the loop: the per-screen catch absorbs
        // transient adb/simctl failures, and a window that will not go away is
        // not one of those.
        if (aborted) throw new Error(`visual capture aborted: ${aborted}`);
        if (files.includes(DONE)) return { count: shot.size, blank };
        if (clock() >= deadline) {
            throw new Error(`visual capture timed out after ${Math.round(timeoutMs / 1000)}s with no ${DONE} (captured ${shot.size})`);
        }
        await wait(pollMs);
    }
}
