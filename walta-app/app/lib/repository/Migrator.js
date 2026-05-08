// Migration runner for non-Alloy repositories. Mirrors Alloy's
// `migrations` tracking table format (`latest TEXT, model TEXT`) and
// migrator API (`createTable`, `dropTable`) so migration files can
// move between this and Alloy with only `migration.up` →
// `exports.up` style edits — see docs/patterns/repository-pattern.md
// (TBD).
//
// Migration file shape (CommonJS):
//
//   exports.up   = function (migrator) { migrator.createTable({...}); };
//   exports.down = function (migrator) { migrator.dropTable(); };
//
// Files live in MIGRATIONS_DIR (below) named `<id>_<table>.js` where
// <id> is a numeric timestamp. Filename is the source of truth for
// both id and table name — the runner enumerates the directory and
// parses both from each filename, matching Alloy's convention.
//
// App startup calls `Migrator.migrate(dbName)` once. The runner scans
// MIGRATIONS_DIR, parses table name from each filename, and applies
// every pending migration against the named db (one tracking row per
// table in that db's `migrations` table). Tests can run against a
// custom-named test db via `Migrator.runForDb(openDbHandle)`.

const MIGRATIONS_DIR = "repository/migrations";

function createMigrator(db, table) {
    return {
        db: db,
        table: table,
        createTable: function (config) {
            const columns = config.columns || {};
            const cols = Object.keys(columns)
                .map(name => name + " " + columns[name])
                .join(", ");
            db.execute("CREATE TABLE IF NOT EXISTS " + table + " (" + cols + ")");
        },
        dropTable: function () {
            db.execute("DROP TABLE IF EXISTS " + table);
        }
    };
}

function getCurrentMigrationId(db, model) {
    db.execute("CREATE TABLE IF NOT EXISTS migrations (latest TEXT, model TEXT)");
    const rs = db.execute("SELECT latest FROM migrations WHERE model = ?", model);
    let mid = null;
    if (rs.isValidRow()) mid = rs.field(0);
    rs.close();
    return mid;
}

function setCurrentMigrationId(db, model, latest) {
    if (getCurrentMigrationId(db, model) !== null) {
        db.execute("UPDATE migrations SET latest = ? WHERE model = ?", latest, model);
    } else {
        db.execute("INSERT INTO migrations (latest, model) VALUES (?, ?)", latest, model);
    }
}

function discoverMigrations() {
    const dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, MIGRATIONS_DIR);
    const entries = (dir && dir.getDirectoryListing()) || [];
    const re = /^(\d+)_(\w+)\.js$/;
    const byTable = {};
    for (let i = 0; i < entries.length; i++) {
        const filename = entries[i];
        const match = filename.match(re);
        if (!match) continue;
        const id = match[1];
        const table = match[2];
        const moduleName = filename.replace(/\.js$/, "");
        const mod = require(MIGRATIONS_DIR + "/" + moduleName);
        if (!byTable[table]) byTable[table] = [];
        byTable[table].push({ id: id, up: mod.up, down: mod.down });
    }
    for (const table in byTable) {
        byTable[table].sort((a, b) =>
            a.id < b.id ? -1 : a.id > b.id ? 1 : 0
        );
    }
    return byTable;
}

function applyForTable(db, table, migrations) {
    const current = getCurrentMigrationId(db, table);
    const pending = migrations.filter(m => current === null || m.id > current);
    if (pending.length === 0) return;

    const migrator = createMigrator(db, table);
    db.execute("BEGIN");
    try {
        for (const migration of pending) {
            migration.up(migrator);
            setCurrentMigrationId(db, table, migration.id);
        }
        db.execute("COMMIT");
    } catch (e) {
        try { db.execute("ROLLBACK"); } catch (_) { /* swallow secondary failure */ }
        throw e;
    }
}

// Run all pending migrations across every table found in
// MIGRATIONS_DIR against an already-open `db` handle. Each table's
// state is tracked independently in the `migrations` table.
exports.runForDb = function (db) {
    const byTable = discoverMigrations();
    for (const table in byTable) {
        applyForTable(db, table, byTable[table]);
    }
};

// Convenience for app startup — open the named db, apply all
// pending migrations, close. Repositories' own `open(dbName)` runs
// afterwards as a plain Ti.Database.open.
exports.migrate = function (dbName) {
    const db = Ti.Database.open(dbName);
    try {
        exports.runForDb(db);
    } finally {
        db.close();
    }
};
