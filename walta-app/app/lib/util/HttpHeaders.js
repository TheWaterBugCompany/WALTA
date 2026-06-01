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
            if (!line) continue;
            const idx = line.indexOf(':');
            if (idx <= 0) continue;
            const name = line.slice(0, idx).trim().toLowerCase();
            const value = line.slice(idx + 1).trim();
            h._entries.set(name, value);
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

exports.HttpHeaders = HttpHeaders;
