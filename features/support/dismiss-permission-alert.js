'use strict';

// Dismisses an iOS system permission alert that overlays the app, by polling.
//
// A one-shot "wait once, tap once" is unreliable on a contended CI runner:
//  - the alert can appear *after* a fixed wait window closes (the app requests
//    the permission on its own schedule, not when the harness happens to look), and
//  - a tap that WebDriverAgent reports as succeeded (HTTP 200) may not actually
//    close a SpringBoard alert.
// With no retry, either miss leaves the alert overlaying the app, which then
// fails the first screen check and — because the alert survives walta://reset —
// every scenario after it.
//
// So poll instead: each round, tap the accept button if it's showing, then
// re-check whether we've reached the target screen (i.e. the alert is gone).
// Stop as soon as we have, or once the budget is spent so an alert that never
// clears fails fast rather than looping to the CI job's ceiling.
//
// The budget is wall-clock, not a round count. A round costs whatever the
// device takes to answer two queries, so counting rounds promises a duration it
// cannot keep: on a session that has slowed to seconds per accessibility
// snapshot the same count runs long past the step waiting on it, and the
// caller's own diagnostic — the one the infra classifier reads — never fires.
//
// The IO seams are injected so the retry logic is unit-testable without a real
// driver, and so is the clock.
module.exports = async function dismissPermissionAlert({ isDone, tapAccept, sleep, now = Date.now, timeoutMs = 60000, pollMs = 500 }) {
    const deadline = now() + timeoutMs;
    while (now() < deadline) {
        if (await isDone()) return true;
        await tapAccept();
        await sleep(pollMs);
    }
    return isDone();
};
