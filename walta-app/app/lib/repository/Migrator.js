// Migration runner for non-Alloy repositories. Mirrors Alloy's
// `migrations` tracking table format (`latest TEXT, model TEXT`) and
// migrator API (`createTable`, `dropTable`) so migration files can
// move between this and Alloy with only `migration.up` →
// `exports.up` style edits — see docs/patterns/repository-pattern.md.
//
// Migrations are listed explicitly in `./migrations/index.js`, each
// entry `{ id, table, up, down }`. We deliberately don't enumerate the
// directory at runtime — `Ti.Filesystem.resourcesDirectory` returned an
// empty listing for bundled lib/ subdirectories on iOS device, which
// silently skipped every migration (WB-78).
//
// App startup calls `Migrator.migrate(dbName)` once. The runner applies
// each pending migration against the named db (one tracking row per
// table in that db's `migrations` table). Tests can run against a
// custom-named test db via `Migrator.runForDb(openDbHandle)`.

const MIGRATIONS = require("./migrations/index");

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

function groupByTable() {
    const byTable = {};
    for (const m of MIGRATIONS) {
        if (!byTable[m.table]) byTable[m.table] = [];
        byTable[m.table].push({ id: m.id, up: m.up, down: m.down });
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

// Run all pending migrations across every table in the manifest
// against an already-open `db` handle. Each table's state is tracked
// independently in the `migrations` table.
exports.runForDb = function (db) {
    const byTable = groupByTable();
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
