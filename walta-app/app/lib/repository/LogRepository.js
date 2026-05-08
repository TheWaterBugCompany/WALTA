// Persistence layer for the SqlSink + SyncFeedback "Show Logs" pane.
// See docs/patterns/logger-sinks.md for the design — sink writes go
// through `append`; the SyncFeedback pane reads via `query`.

const Migrator = require("./Migrator");

const TABLE = "logs";
// Migrator scans this directory for files matching <id>_logs.js. To
// add a new migration just drop a new file in here — the loader picks
// it up by filename (id is parsed from the timestamp prefix). Format
// matches Alloy's app/migrations/ exactly modulo `migration` →
// `exports`. See docs/patterns/repository-pattern.md (TBD).
const MIGRATIONS_PATH = "repository/migrations";

const LEVEL_RANK = { debug: 0, trace: 1, info: 2, warn: 3, error: 4 };

exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);
    Migrator.runMigrations(db, TABLE, MIGRATIONS_PATH);

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
