# Repository pattern (non-Alloy persistence)

A small persistence convention for tables that don't fit Alloy's model
machinery. Currently used by [logger-sinks.md](logger-sinks.md)
(`LogRepository`); the same shape is meant to host future tables —
sync queue, key cache, etc. — so they don't drag Backbone or Alloy's
build-time wiring along just to talk to SQLite.

## Why not Alloy?

Alloy's `Alloy.M(...)` models give you migrations, schema, and
fetch/save in one bundle. That's a good fit for *records the user
edits in the UI* (`sample`, `taxa`) — Backbone change events drive
view updates and sync naturally. It's a poor fit for everything else:

- **High-volume append-only data** (logs) doesn't need per-row Backbone
  models.
- **Internal caches** (a future key cache, or a sync-queue) don't need
  collection-level events or saving back through Backbone.
- **Build-time wiring** — Alloy's compiler scans `app/migrations/`,
  matches files to models, and synthesises the migration runner. The
  whole thing only fires when you instantiate the model. A utility
  module that just wants a SQLite handle pays a lot of incidental
  cost to plug in.

The repository pattern lets these tables coexist with Alloy without
inheriting Alloy.

## Anatomy

```
walta-app/app/lib/repository/
├── Migrator.js                 — runs migrations at startup (shared)
├── LogRepository.js            — first repository
└── migrations/
    ├── index.js                — explicit manifest, `[{id,table,up,down}, ...]`
    └── 202605080000000_logs.js — Alloy-shape migration file
```

### The Migrator

One shared module per app. Exposes:

- `Migrator.migrate(dbName)` — opens the named db, reads
  `repository/migrations/index.js`, applies every pending migration
  grouped per table, closes. Called once at app startup from
  [walta-app/app/alloy.js](../../walta-app/app/alloy.js).
- `Migrator.runForDb(db)` — same logic against an already-open db
  handle. Used by tests that target a custom-named test db.

The runner deliberately doesn't enumerate the directory at runtime —
`Ti.Filesystem.resourcesDirectory` returned an empty listing for
bundled `lib/` subdirectories on iOS device, silently skipping every
migration. The static manifest is bundled by Titanium's
CommonJS resolver at build time, so simulator and device behave
identically.

State tracking matches Alloy's: a `migrations (latest TEXT, model TEXT)`
table inside the same db, with one row per table. Each `up()` runs in
a `BEGIN`/`COMMIT` transaction that rolls back on failure.

### Migration file shape

Identical to Alloy's `app/migrations/` files modulo `migration` →
`exports`:

```js
exports.up = function (migrator) {
    migrator.createTable({
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "ts": "INTEGER NOT NULL"
            // ...
        }
    });
};

exports.down = function (migrator) {
    migrator.dropTable();
};
```

The migrator object passed to up/down is the same shape Alloy's
sql adapter exposes (`db`, `table`, `createTable`, `dropTable`).

The filename `<id>_<table>.js` is the source of truth for both the
migration id and the SQL table name — the runner parses both at
discovery time. No metadata in the file body beyond `up`/`down`.

### Repository module

Plain CommonJS. Opens the db, returns an object with whatever
operations make sense for the table. Shape is up to the repository —
there's no enforced base class.

```js
// LogRepository.js
exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);
    return {
        append: (entry) => { /* INSERT */ },
        query: (opts) => { /* SELECT, returns array of rows */ },
        prune: (maxAge, maxRows) => { /* DELETE retention */ },
        close: () => db.close()
    };
};
```

`open()` is **pure** — just opens. Schema setup is the caller's job
via `Migrator.migrate(dbName)` at app startup. Repositories don't run
their own migrations on open; that would couple every consumer of the
repo to an implicit "first call sets up the schema" behaviour.

## Shared db: `waterbug_data`

All non-Alloy tables live in one SQLite database, currently named
`waterbug_data`. Lock contention isn't a concern at this app's scale
(mobile, single user, low write volume), and a shared db keeps the
Migrator API simple — one call covers every non-Alloy table.

Alloy's `samples` and `taxa` databases stay separate per Alloy's
convention.

## Adding a new repository

1. Create `walta-app/app/lib/repository/XxxRepository.js`. `open()`
   takes a dbName, opens, returns operation methods.
2. Add a migration file
   `walta-app/app/lib/repository/migrations/<timestamp>_<table>.js`
   creating the table. Use the current UTC time formatted as
   `YYYYMMDDhhmmssSSS` for the timestamp.
3. Append an entry to `walta-app/app/lib/repository/migrations/index.js`
   pointing at the new file. Without this the migration is bundled but
   never runs.
4. No change to `alloy.js` — `Migrator.migrate("waterbug_data")` already
   walks the manifest, so the new entry runs automatically.
5. Tests against the repository call `Migrator.migrate(testDbName)`
   before opening the repository, so schema is in place.

That's it — no model file, no compiler hooks, no `Alloy.M()` call.

## Migrating FROM Alloy

If a table currently managed by Alloy needs to leave (because the
domain doesn't really fit Backbone), the per-file change is small:

| Source | Alloy file | Repository file |
|---|---|---|
| Body | `migration.up = function (m) { ... }` | `exports.up = function (m) { ... }` |
| Body | `migration.down = function (m) { ... }` | `exports.down = function (m) { ... }` |
| Path | `app/migrations/<ts>_<name>.js` | `app/lib/repository/migrations/<ts>_<name>.js` |

Plus delete the Alloy model file (`app/models/<name>.js`) and write a
`<name>Repository.js` with whatever operations the consumers need.

The migration tracking schema is identical (`migrations (latest TEXT,
model TEXT)`) and column types stay the same — existing data carries
over without a re-migrate. The old Alloy-managed db is renamed (or
its tables moved) into `waterbug_data` as part of the cutover.

## Testing

Tests use a custom db name (e.g. `waterbug_data_test`) so they don't
trample production data, and migrate it explicitly:

```js
beforeEach(function () {
    removeDatabase(TEST_DB);
    Migrator.migrate(TEST_DB);
    repo = LogRepository.open(TEST_DB);
});
```

Repository specs live next to their consumers' specs in
`walta-app/app/spec/util/repository/<Name>_spec.js` — device specs
because `Ti.Database` doesn't run in Node, and a real-SQLite test is
worth more than mocking the entire db.
