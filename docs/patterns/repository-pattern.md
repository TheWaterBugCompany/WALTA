# Repository pattern (non-Alloy persistence)

A persistence convention for tables that don't fit Alloy's model
machinery, so they don't drag Backbone or Alloy's build-time wiring
along just to talk to SQLite. Two shapes live under
`walta-app/app/lib/repository/` and it matters which one you're writing
(see [Repository vs row-DAO](#two-shapes-repository-vs-row-dao)):

- A **Repository** hydrates and persists **domain model objects** — the
  controller calls the repository, the repository creates the models,
  the models never call back. `TrainingRepository` (returns
  `SampleTray`/`Taxon`) is the reference example.
- A **row-DAO** returns plain row objects, for internal append-only or
  query-only data with no domain model. `LogRepository` (returns log
  rows for the "Show Logs" pane) is the reference example.

Both share the same `Migrator` + migration-file plumbing below; they
differ only in what `open()`'s methods return.

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

## Two shapes: Repository vs row-DAO

Both live in `lib/repository/`, but they play different roles — don't
copy the wrong one. The question is: **does this table back a domain
model the app mutates and observes?**

| | Repository | row-DAO |
|---|---|---|
| Returns | domain model objects (aggregate/entity) | plain row objects `{ col: value }` |
| For | data with behaviour + a live view (the tray) | internal append-only / query-only data (logs, a cache) |
| Direction | controller → repository → models; models never touch the repo | caller → DAO → rows |
| Example | `TrainingRepository` → `SampleTray`/`Taxon` | `LogRepository` → log rows |

`LogRepository` returning row hashes is correct **because logs have no
domain model** — they're written by a sink and read into a list pane,
nothing mutates or observes them. That's a DAO. Don't take it as the
template for a table that *does* have a domain model: returning hashes
there leaks the DB schema into every caller and there's no object to
attach behaviour or change-notification to.

For a table with a domain model, the repository's job is to **create
and persist the domain objects** — it depends on the models (data →
domain, the correct inward direction), the models never depend on it
(a model that calls its repository is a fat-model anti-pattern), and
the models never import `Ti.Database` (decoupled from the persist
engine, so the layer ports — e.g. to Flutter's `sqflite`/`drift` —
behind the same interface). Change-notification lives on the model
(a `ChangeNotifier`), never the repository.

```js
// TrainingRepository.js — a Repository: creates/persists/returns models
exports.open = function (dbName) {
    const db = Ti.Database.open(dbName);
    return {
        startSession: (code) => { /* wipe + INSERT */ return new SampleTray(); },
        loadTray:     () => { /* SELECT → new Taxon per row */ return new SampleTray(taxa); },
        addTaxon:     (tray, taxonId, position) => {
            /* INSERT */
            const taxon = new Taxon({ id: db.lastInsertRowId, taxonId, position });
            tray.add(taxon);   // repo mutates the aggregate it created; the model emits change
            return taxon;
        },
        // …
    };
};
```

The domain models are plain classes in `lib/models/`
(`SampleTray extends ChangeNotifier`, `Taxon`), unaware of persistence.

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

Plain CommonJS. `open(dbName)` opens the db and returns an object with
whatever operations make sense — no enforced base class. What those
operations *return* is the [Repository-vs-DAO](#two-shapes-repository-vs-row-dao)
choice: domain models, or rows.

```js
// LogRepository.js — the row-DAO shape (logs have no domain model)
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

## Which db: shared `waterbug_data`, or an isolated one

Internal, low-stakes data (logs, a future cache) shares one SQLite db,
`waterbug_data`. Lock contention isn't a concern at this app's scale
(mobile, single user, low write volume), and a shared db keeps things
simple.

**Isolated draft stores get their own db.** Training persists to
`waterbug_training`, kept entirely apart from the real-sample archive
so training data *can't* leak into sync/upload/history queries — those
run against Alloy's `samples` db and structurally cannot see another
file. Isolation-by-construction beats a discriminator column you have
to remember to filter on. The survey/edit draft store will be a
separate isolated db for the same reason.

An isolated db is migrated with its own `Migrator.migrate(dbName)` call
at startup (alongside the `waterbug_data` one). Note the current
limitation: the migration manifest is global, so `migrate(dbName)`
applies *every* migration to whichever db it's given — fine while the
tables are harmless to co-create, but scoping the manifest per-db is
the natural next step as more isolated dbs appear.

Alloy's `samples` and `taxa` databases stay separate per Alloy's
convention.

## Adding a new repository

1. Decide the shape: does the table back a domain model? If yes, write
   a **Repository** that returns domain models from `lib/models/` (see
   [Repository vs row-DAO](#two-shapes-repository-vs-row-dao)); if it's
   internal append-only/query-only data, a **row-DAO** returning rows
   is right. Then create `walta-app/app/lib/repository/XxxRepository.js`
   — `open()` takes a dbName, opens, returns operation methods.
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

That's it — no *Alloy* model file, no compiler hooks, no `Alloy.M()`
call. (A Repository still has its plain domain models in `lib/models/`;
those are pure classes, not Alloy models.)

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
