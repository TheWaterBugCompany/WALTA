// Thin Logger sink adapter — see docs/patterns/logger-sinks.md.
// Persistence, schema, queries, and retention all live in
// LogRepository. This module's only job is to satisfy the sink
// contract and forward entries to repo.append.
//
// Persists every level including "debug": debug is filtered out of the
// in-app Show Logs pane (minLevel: info) but is wanted in the exported
// diagnostics report, which is the only place it's ever read back.

exports.create = function (repo) {
    return {
        levels: ["trace", "debug", "info", "warn", "error"],
        write: async function (entry) {
            repo.append(entry);
        }
    };
};
