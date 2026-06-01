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
}

exports.HttpHeaders = HttpHeaders;
