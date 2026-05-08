// Thin Logger sink adapter — see docs/patterns/logger-sinks.md.
// Persistence, schema, queries, and retention all live in
// LogRepository. This module's only job is to satisfy the sink
// contract and forward entries to repo.append.
//
// Levels: skip "debug" — dev-only noise that doesn't need persisting.

exports.create = function (repo) {
    return {
        levels: ["trace", "info", "warn", "error"],
        write: async function (entry) {
            repo.append(entry);
        }
    };
};
