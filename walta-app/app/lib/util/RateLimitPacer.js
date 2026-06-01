const DEFAULT_HEADER_NAMES = {
    remaining: "x-ratelimit-remaining",
    reset: "x-ratelimit-reset",
    date: "date",
};

function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function lookupHeader(headers, name) {
    if (!headers || typeof headers !== "object") return undefined;
    const target = name.toLowerCase();
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === target) return headers[key];
    }
    return undefined;
}

function parseFiniteInt(raw) {
    if (raw == null) return undefined;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && String(n) === String(raw).trim() ? n : undefined;
}

function createPacer(opts = {}) {
    const headroom = opts.headroom != null ? opts.headroom : 10;
    const fallbackDelayMs = opts.fallbackDelayMs != null ? opts.fallbackDelayMs : 2500;
    const now = opts.now || (() => Date.now());
    const sleep = opts.sleep || defaultSleep;
    const headerNames = Object.assign({}, DEFAULT_HEADER_NAMES, opts.headerNames || {});

    let remaining = null;
    let resetAt = null;
    let lastReqStarted = now();

    function observe(headers) {
        const remainingRaw = lookupHeader(headers, headerNames.remaining);
        const resetRaw = lookupHeader(headers, headerNames.reset);
        const remainingParsed = parseFiniteInt(remainingRaw);
        const resetEpochSeconds = parseFiniteInt(resetRaw);
        if (remainingParsed === undefined || resetEpochSeconds === undefined) return;

        const dateRaw = lookupHeader(headers, headerNames.date);
        const serverNowMs = dateRaw ? Date.parse(dateRaw) : NaN;
        const skewMs = Number.isFinite(serverNowMs) ? serverNowMs - now() : 0;

        remaining = Math.max(0, remainingParsed);
        resetAt = resetEpochSeconds * 1000 - skewMs;
    }

    async function acquire() {
        let wait = 0;
        if (remaining === null || resetAt === null) {
            // No header data — pace conservatively so we don't burst a server
            // that hasn't told us its limit. Once the first response lands,
            // subsequent acquires use the real bucket and skip this branch.
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
    }

    return { observe, acquire };
}

exports.createPacer = createPacer;
