'use strict';

// Polls `sample()` until two consecutive reads are identical — i.e. the view
// has stopped changing — then returns. Replaces fixed "let it settle" sleeps:
// it returns as soon as the screen is stable rather than always paying a
// worst-case delay, and it still bounds itself so a view that never settles
// gives up instead of hanging.
//
// `sample` should return a value that changes while the view is in flux and
// stabilises when it isn't (e.g. the Appium page source). `clock`/`sleep` are
// injectable for tests.
module.exports = async function waitForSettled(sample, {
    interval = 150,
    timeout = 5000,
    clock = Date.now,
    sleep = ms => new Promise(r => setTimeout(r, ms)),
} = {}) {
    const deadline = clock() + timeout;
    let previous = await sample();
    while (clock() < deadline) {
        await sleep(interval);
        const current = await sample();
        if (current === previous) return;
        previous = current;
    }
};
