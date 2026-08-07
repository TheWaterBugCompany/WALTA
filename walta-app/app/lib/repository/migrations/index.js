// Static manifest of repository migrations. Each entry is bundled at
// build time via require() so the runner doesn't depend on filesystem
// enumeration of `Resources/.../repository/migrations/` — which returns
// empty on iOS device, breaking startup migrations (WB-78).
//
// Adding a migration:
//   1. Create `<id>_<table>.js` next to this file using the up/down shape
//      documented in docs/patterns/repository-pattern.md
//   2. Append a new entry below in id-order. Migrator sorts per table so
//      append-vs-insert-in-the-middle doesn't matter functionally, but
//      keeping the list ordered makes diffs readable.
//
// `id` and `table` mirror the parts of the old filename convention
// (<id>_<table>.js) — they're the runner's source of truth for tracking
// which migrations have applied.

const logs_202605080000000 = require("./202605080000000_logs");
const training_taxa_202608070000001 = require("./202608070000001_training_taxa");

module.exports = [
    { id: "202605080000000", table: "logs", up: logs_202605080000000.up, down: logs_202605080000000.down },
    { id: "202608070000001", table: "training_taxa", up: training_taxa_202608070000001.up, down: training_taxa_202608070000001.down },
];
