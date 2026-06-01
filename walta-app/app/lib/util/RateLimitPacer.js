function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPacer(opts = {}) {
    const headroom = opts.headroom != null ? opts.headroom : 10;
    const fallbackDelayMs = opts.fallbackDelayMs != null ? opts.fallbackDelayMs : 2500;
    const now = opts.now || (() => Date.now());
    const sleep = opts.sleep || defaultSleep;

    let remaining = null;
    let resetAt = null;
    let lastReqStarted = now();
    let hasFiredRequest = false;

    function observe(headers) {
        const remainingParsed = parseInt(headers?.["X-RateLimit-Remaining"]);
        const resetEpochSeconds = parseInt(headers?.["X-RateLimit-Reset"]);
        if (!Number.isFinite(remainingParsed) || !Number.isFinite(resetEpochSeconds)) return;

        const serverNowMs = Date.parse(headers["Date"]);
        const skewMs = Number.isFinite(serverNowMs) ? serverNowMs - now() : 0;

        remaining = Math.max(0, remainingParsed);
        resetAt = resetEpochSeconds * 1000 - skewMs;
    }

    async function acquire() {
        let wait = 0;
        if (!hasFiredRequest) {
            // First request is always instant — one request can't burst a
            // server, and we need it out to learn the bucket state.
        } else if (remaining === null || resetAt === null) {
            // Still no header data after a previous request — pace
            // conservatively so a repeated burst can't hammer a server that
            // isn't telling us its limit.
            const elapsed = now() - lastReqStarted;
            wait = Math.max(0, fallbackDelayMs - elapsed);
        } else if (remaining <= headroom) {
            const t = now();
            const msUntilReset = Math.max(0, resetAt - t);
            const spread = Math.floor(msUntilReset / Math.max(remaining, 1));
            const elapsed = t - lastReqStarted;
            wait = Math.max(0, spread - elapsed);
        }
        if (wait > 0) await sleep(wait);
        lastReqStarted = now();
        hasFiredRequest = true;
    }

    return { observe, acquire };
}

exports.createPacer = createPacer;
