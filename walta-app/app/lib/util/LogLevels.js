// Single source of truth for log-level ordering, shared by Logger
// (subscriber minLevel filtering) and LogRepository (query minLevel).
// Conventional verbosity order: trace is the most verbose, error the
// most severe. See docs/patterns/logger-sinks.md.
exports.LEVEL_RANK = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
