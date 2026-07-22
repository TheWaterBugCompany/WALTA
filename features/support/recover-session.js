'use strict';

// Rebuilds a dropped Appium/WDA session, bounded. Contended CI runners
// occasionally drop the session mid-run (WB-149); the session is created once
// and reused across scenarios, so a drop would otherwise fail every remaining
// scenario. This retries a fixed number of times and *verifies the rebuilt
// session actually answers* before declaring success.
//
// If the runner has collapsed unrecoverably it throws, so the run fails fast
// with a clear error instead of every subsequent call hammering a dead session
// until the CI job hits its execution ceiling (WB-200). `isAlive`/`reconnect`
// are injected so the bounded-retry logic is testable without a real driver.
module.exports = async function recoverSession({ isAlive, reconnect, maxAttempts = 3 }) {
    if (await isAlive()) return false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await reconnect();
        if (await isAlive()) return true;
    }
    throw new Error(`driver session unrecoverable after ${maxAttempts} reconnect attempts`);
};
