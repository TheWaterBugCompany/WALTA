// Migration runner for non-Alloy repositories. Mirrors Alloy's
// `migrations` tracking table format (`latest TEXT, model TEXT`) and
// migrator API (`createTable`, `dropTable`) so migration files can
// move between this and Alloy without rewrites — see
// docs/patterns/repository-pattern.md (TBD).
//
// Migration file shape (in repository/migrations/<timestamp>_<table>.js):
//
//   exports.id = "<timestamp>";
//   exports.up   = function (migrator) { migrator.createTable({ columns: {...} }); };
//   exports.down = function (migrator) { migrator.dropTable(); };

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

// Run any pending migrations (id > current) for `table`, in order.
// All run inside a single transaction so partial failure rolls back.
exports.runMigrations = function (db, table, migrations) {
    const sorted = migrations.slice().sort((a, b) =>
        a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const current = getCurrentMigrationId(db, table);
    const pending = sorted.filter(m => current === null || m.id > current);
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
};
