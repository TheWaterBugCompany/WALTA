// Polls `sample()` until two consecutive reads are identical — i.e. the display
// has stopped changing — then returns that settled value, bounded by a timeout so
// a view that never settles gives up (returning its latest sample) rather than
// hanging. The on-device twin of features/support/wait-for-settled.js: the visual
// capture runner feeds it `() => view.toImage().length` so a screenshot is only
// taken once lazy tiles / async photos / fades have finished drawing.
//
// `clock`/`sleep` are injectable so the bounded-poll logic is unit-testable in
// node without a real Ti view or real delays.
function waitForStable(sample, {
    interval = 200,
    timeout = 5000,
    clock = Date.now,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
} = {}) {
    return (async () => {
        const deadline = clock() + timeout;
        let previous = sample();
        while (clock() < deadline) {
            await sleep(interval);
            const current = sample();
            if (current === previous) return current;
            previous = current;
        }
        return previous;
    })();
}

module.exports = waitForStable;
