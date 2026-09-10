import path from "path";
import { looksBlank as frameLooksBlank } from "./blankFrame.js";
import { fingerprint as frameFingerprint } from "./frameFingerprint.js";

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

// How many times to re-grab a screen whose frame keeps changing. A frame is
// only acked once two grabs in a row are identical, because a screen can be
// fully drawn and still not be finished: chrome that fades on its own schedule
// (a web view's scroll indicator), a modal still arriving over its host,
// content that draws late. Each of those makes a frame that looks complete and
// then diffs against the baseline for a reason nobody caused.
//
// Bounded, because some screens never hold still — a playing video — and one of
// those must not strand the runner or lose the screens queued behind it.
const SETTLE_ATTEMPTS = 4;

// The window the OS has focused, when it belongs to something other than the app
// under capture. Launchers that can't answer (iOS has no equivalent of dumpsys)
// leave the check off rather than guessing.
async function foreignWindow(launcher, appId) {
    if (!launcher.foregroundWindow) return null;
    const focused = await launcher.foregroundWindow();
    return focused && !focused.includes(appId) ? focused : null;
}

export async function collectHandshake({ launcher, appId, actualDir, timeoutMs, pollMs = 200, now, sleep, log,
    looksBlank = frameLooksBlank, blankAttempts = BLANK_ATTEMPTS,
    fingerprint = frameFingerprint, settleAttempts = SETTLE_ATTEMPTS }) {
    const clock = now || (() => Date.now());
    const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    const note = log || (() => {});
    const shot = new Set();
    const blank = [];
    const unsettled = [];
    const attempts = new Map();
    const settleTries = new Map();
    const lastFrame = new Map();
    let obscuredBy = null;
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
                    // Reported on the transition, not every poll: the runner holds
                    // the screen, so this can legitimately repeat for as long as
                    // the app takes to reach the foreground.
                    if (obscuredBy !== intruder) {
                        note(`  visual: ${name} came back behind ${intruder}, holding until it clears`);
                        obscuredBy = intruder;
                    }
                    continue;
                }
                obscuredBy = null;
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
                    if (!blank.includes(name)) {
                        note(`  visual: ${name} still blank after ${tries} grabs — keeping the empty frame`);
                        blank.push(name);
                    }
                }
                // Hold until the frame stops changing between grabs. The runner
                // is holding this screen until we ack it, so a re-grab sees the
                // same screen — this is waiting for it to finish drawing, not
                // retrying the screen.
                const frame = await fingerprint(file);
                const previous = lastFrame.get(name);
                lastFrame.set(name, frame);
                const settling = (settleTries.get(name) || 0) + 1;
                settleTries.set(name, settling);
                if (frame !== previous) {
                    if (settling < settleAttempts) { continue; }
                    note(`  visual: ${name} never held still after ${settling} grabs — keeping the last frame`);
                    unsettled.push(name);
                }
                await launcher.writeVisualCaptureFile(appId, `${name}.shot`);
                shot.add(name);
            } catch (e) {
                note(`  visual: ${name} shot failed, will retry (${e && e.message ? e.message : e})`);
            }
        }
        // Done means the runner has finished opening screens, not that we have
        // finished grabbing them: a screen whose .ready lands in the same poll
        // still owes us a second grab to know its frame has stopped moving.
        const outstanding = files.some((f) => {
            const m = /^(.+)\.ready$/.exec(f);
            return m && !shot.has(m[1]);
        });
        if (files.includes(DONE) && !outstanding) { return { count: shot.size, blank, unsettled }; }
        if (clock() >= deadline) {
            // The window in the way is the cause worth naming: without it this
            // reads as "the app never finished", which is a different bug.
            throw new Error(`visual capture timed out after ${Math.round(timeoutMs / 1000)}s with no ${DONE} (captured ${shot.size})`
                + (obscuredBy ? `; the screen was behind ${obscuredBy}` : ""));
        }
        await wait(pollMs);
    }
}
