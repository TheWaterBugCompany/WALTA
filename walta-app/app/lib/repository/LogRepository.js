// Persistence layer for the SqlSink + SyncFeedback "Show Logs" pane.
// See docs/patterns/logger-sinks.md for the design — sink writes go
// through `append`; the SyncFeedback pane reads via `query`.

const LEVEL_RANK = { debug: 0, trace: 1, info: 2, warn: 3, error: 4 };

// Append a function for each schema change. Existing entries must
// not be modified — the migrator runs each one exactly once, in
// order, then bumps PRAGMA user_version.
const MIGRATIONS = [
    function v1(db) {
        db.execute(
            "CREATE TABLE logs (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "ts INTEGER NOT NULL, " +
            "level TEXT NOT NULL, " +
            "facility TEXT, " +
            "message TEXT" +
            ")"
        );
    }
];

function migrate(db) {
    const rs = db.execute("PRAGMA user_version");
    const version = rs.fieldByName("user_version") || 0;
    rs.close();
    for (let i = version; i < MIGRATIONS.length; i++) {
        MIGRATIONS[i](db);
        db.execute("PRAGMA user_version = " + (i + 1));
    }
}

exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);
    migrate(db);

    return {
        append: function (entry) {
            db.execute(
                "INSERT INTO logs (ts, level, facility, message) VALUES (?, ?, ?, ?)",
                entry.ts, entry.level, entry.facility, entry.message
            );
        },

        query: function (opts) {
            opts = opts || {};
            const conditions = [];
            const params = [];
            if (opts.facility) {
                conditions.push("facility = ?");
                params.push(opts.facility);
            }
            if (opts.minLevel) {
                const minRank = LEVEL_RANK[opts.minLevel];
                const allowed = Object.keys(LEVEL_RANK).filter(l => LEVEL_RANK[l] >= minRank);
                conditions.push("level IN (" + allowed.map(() => "?").join(",") + ")");
                allowed.forEach(l => params.push(l));
            }
            const where = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
            const limit = opts.limit ? " LIMIT " + Number(opts.limit) : "";
            const sql = "SELECT ts, level, facility, message FROM logs" + where + " ORDER BY ts DESC" + limit;
            const rs = db.execute.apply(db, [sql].concat(params));
            const rows = [];
            try {
                while (rs.isValidRow()) {
                    rows.push({
                        ts: rs.fieldByName("ts"),
                        level: rs.fieldByName("level"),
                        facility: rs.fieldByName("facility"),
                        message: rs.fieldByName("message")
                    });
                    rs.next();
                }
            } finally {
                rs.close();
            }
            return rows;
        },

        // Row cap keeps the highest `maxRows` ids (newest insertions).
        // In normal use id and ts agree because entries get `ts: Date.now()`
        // when they're appended; using id rather than ts means we don't
        // need a separate index.
        prune: function (maxAgeMs, maxRows) {
            if (maxAgeMs) {
                const cutoff = Date.now() - maxAgeMs;
                db.execute("DELETE FROM logs WHERE ts < ?", cutoff);
            }
            if (maxRows) {
                db.execute(
                    "DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT ?)",
                    maxRows
                );
            }
        },

        close: function () {
            db.close();
        }
    };
};
