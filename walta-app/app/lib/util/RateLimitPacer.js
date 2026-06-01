function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPacer({
    headroom = 10,
    fallbackDelayMs = 2500,
    now = () => Date.now(),
    sleep = defaultSleep,
} = {}) {
    let remainingRequests = null;
    let resetAt = null;
    let lastReqStarted = now();
    let hasFiredRequest = false;

    function observe(headers) {
        const remainingParsed = parseInt(headers.get("x-ratelimit-remaining"));
        const resetEpochSeconds = parseInt(headers.get("x-ratelimit-reset"));
        if (!Number.isFinite(remainingParsed) || !Number.isFinite(resetEpochSeconds)) return;

        const serverNowMs = Date.parse(headers.get("date"));
        const skewMs = Number.isFinite(serverNowMs) ? serverNowMs - now() : 0;

        remainingRequests = Math.max(0, remainingParsed);
        resetAt = resetEpochSeconds * 1000 - skewMs;
    }

    async function acquire() {
        let wait = 0;
        if (!hasFiredRequest) {
            // First request is always instant — one request can't burst a
            // server, and we need it out to learn the bucket state.
        } else if (remainingRequests === null || resetAt === null) {
            // Still no header data after a previous request — pace
            // conservatively so a repeated burst can't hammer a server that
            // isn't telling us its limit.
            const elapsed = now() - lastReqStarted;
            wait = Math.max(0, fallbackDelayMs - elapsed);
        } else if (remainingRequests === 0) {
            // Budget exhausted — wait until the bucket resets.
            wait = Math.max(0, resetAt - now());
        } else if (remainingRequests <= headroom) {
            // Spread the remaining budget evenly across the rest of the
            // window — one request every msUntilReset/remainingRequests ms,
            // less however long we've already waited since the last request.
            const t = now();
            const msUntilReset = Math.max(0, resetAt - t);
            const spread = Math.floor(msUntilReset / remainingRequests);
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
