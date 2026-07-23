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
// Stop as soon as we have, or after a bounded number of rounds so an alert that
// never clears fails fast rather than looping to the CI job's ceiling. The IO
// seams are injected so the retry logic is unit-testable without a real driver.
module.exports = async function dismissPermissionAlert({ isDone, tapAccept, sleep, maxRounds = 180, pollMs = 500 }) {
    for (let round = 0; round < maxRounds; round++) {
        if (await isDone()) return true;
        await tapAccept();
        await sleep(pollMs);
    }
    return isDone();
};
