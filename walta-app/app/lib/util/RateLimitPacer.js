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
    const maxDelayMs = opts.maxDelayMs != null ? opts.maxDelayMs : 2500;
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
        if (remaining !== null && resetAt !== null && remaining <= headroom) {
            const t = now();
            const msUntilReset = Math.max(0, resetAt - t);
            const spread = Math.floor(msUntilReset / Math.max(remaining, 1));
            const elapsed = t - lastReqStarted;
            const wait = Math.min(Math.max(0, spread - elapsed), maxDelayMs);
            if (wait > 0) await sleep(wait);
        }
        lastReqStarted = now();
    }

    return { observe, acquire };
}

exports.createPacer = createPacer;
