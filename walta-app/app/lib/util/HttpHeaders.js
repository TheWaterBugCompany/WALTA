const splitByFirst = require('./splitByFirst');

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
    const parts = splitByFirst(line, ':');
    if (!parts || !parts[0]) return null;
    return { name: parts[0], value: parts[1] };
}

exports.HttpHeaders = HttpHeaders;
