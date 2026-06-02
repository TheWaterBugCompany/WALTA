const SENSITIVE_HEADER_NAMES = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'x-auth-token',
    'x-api-key',
    'x-csrf-token',
]);

class HttpHeaders {
    constructor() {
        this._entries = new Map();
    }

    static parse(raw) {
        const h = new HttpHeaders();
        if (!raw) return h;
        for (const line of raw.split(/\r?\n/)) {
            const entry = parseHeaderLine(line);
            if (entry) h._entries.set(entry.name.toLowerCase(), entry.value);
        }
        return h;
    }

    get(name) {
        return this._entries.get(name.toLowerCase());
    }

    get size() {
        return this._entries.size;
    }

    entries() {
        return this._entries.entries();
    }

    formatForLog() {
        if (!this.size) return '';
        const out = {};
        for (const [name, value] of this.entries()) {
            out[name] = SENSITIVE_HEADER_NAMES.has(name) ? '[REDACTED]' : value;
        }
        return ` headers=${JSON.stringify(out)}`;
    }
}

function parseHeaderLine(line) {
    const idx = line.indexOf(':');
    if (idx <= 0) return null;
    return {
        name: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
    };
}

exports.HttpHeaders = HttpHeaders;
