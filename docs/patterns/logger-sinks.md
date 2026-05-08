# Logger — sink-based dispatch

`Logger` is a thin dispatcher in front of pluggable sinks. Each call site
hands `Logger` a level and a message; `Logger` formats an entry and
forwards it to every registered sink. The sinks decide what to do with
it (write to console, ship to Bugfender, persist to SQLite, …).

## Why

- **Silent by default in tests.** With zero sinks registered, logging is
  a no-op. App startup configures whichever sinks are appropriate; tests
  register none, or a capturing test sink.
- **Pluggable persistence.** Adding a new destination (e.g. SQLite for
  surviving background/resume) is a new sink, not another inline branch
  in every `Logger` method.
- **Per-sink level filter.** `debug` is dev-only noise — it should hit
  `ConsoleSink` but not be shipped to Bugfender or persisted to SQLite.
  The level allowlist lives on the sink, not in `Logger`.
- **Cross-run log visibility.** `SqlSink` writes entries through a
  separate `LogRepository` that persists them across background/resume,
  so the SyncFeedback "Show Logs" pane can query prior-run history via
  `LogRepository.query()` — which is exactly when sync issues need
  diagnosing.
- **Persistence is its own concern.** `SqlSink` only knows about the
  Logger sink contract (`write(entry)`, `levels`, fire-and-forget).
  Schema, migrations, queries, and retention live in `LogRepository`.
  This keeps the sink ~10 lines and lets other consumers (the
  SyncFeedback pane, future debug overlays) talk to the repository
  directly without going through the sink.
- **Decoupled live updates.** Reactive UI surfaces subscribe to
  facility/level matches on `Logger` itself, independent of any sink.
  Sink failure or absence doesn't break the live stream — sinks are
  persistence destinations, subscribers are in-process consumers.

## Sink interface

A sink is any object with an async `write(entry)` method:

```js
{
  async write(entry) { /* { ts, level, facility, message } */ }
}
```

`Logger` fires and forgets — call sites never `await`, and `Logger`
itself never blocks on I/O. If a sink's `write()` rejects, `Logger`
falls back to `Ti.API.log` directly so the diagnostic isn't swallowed
silently.

## Subscribers

Independent of sinks, any module can subscribe to log entries that
match a facility + minimum-level filter:

```js
const unsubscribe = Logger.subscribe(
  { facility: "sync", minLevel: "info" },
  entry => { /* { ts, level, facility, message } */ }
);
```

Subscribers fire from the dispatcher for every matching entry —
regardless of whether sinks accepted, rejected, or are even registered.
They're for reactive in-process consumers (e.g. the SyncFeedback "Show
Logs" pane); persistence and shipping live in sinks.

## Levels

`debug`, `trace`, `info`, `warn`, `error`. All five fan out to every
registered sink and to every matching subscriber. Sinks narrow with a
level allowlist; subscribers use `minLevel` to receive everything at
or above a threshold. Ordering: `debug < trace < info < warn < error`.

## Facility taxonomy

Every entry carries a `facility` string in addition to its level (e.g.
`sync`, `auth`, `key-loader`, `ui`). Consumers slice on facility — the
SyncFeedback pane queries `LogRepository` with `facility=sync,
minLevel=info` for prior-run history, and subscribes via
`Logger.subscribe()` with the same filter for live updates.

## Migration status (WB-64)

This refactor is being landed incrementally. Order:

1. Sink dispatcher + `addSink` (foundation). *Done.*
2. Migrate `ConsoleSink` and `BugfenderSink` onto the sink interface,
   each with a level allowlist. *Done.*
3. Add `LogRepository` and `SqlSink` for log persistence across
   background/resume. *Done.* Two modules, two responsibilities:
   - `LogRepository.open(dbName)` opens `Ti.Database`, runs migrations
     via `PRAGMA user_version`, and exposes `append(entry)`,
     `query({ facility, minLevel, limit })`, `prune(maxAgeMs, maxRows)`,
     `close()`. Tested at the device-spec layer against a real
     `Ti.Database` (`walta-app/app/spec/util/repository/LogRepository_spec.js`).
   - `SqlSink.create(repo)` is the Logger sink adapter — `levels`
     allowlist (`trace`, `info`, `warn`, `error` — skips `debug`)
     plus `async write(entry) { repo.append(entry); }`. Sync throws
     from `repo.append` become async rejections, handled by the
     dispatcher's `Ti.API.log` fallback.
   - `Logger.configure()` opens the repo, prunes at startup
     (14 days OR 5,000-row cap), and registers SqlSink.
   First non-Alloy persistence module — establishes the pattern for
   future repositories (own migrations, no Backbone).
4. Add `Logger.info()` and apply the facility taxonomy across the ~38
   files of existing call sites. *Done.* Eight facilities: `sync`,
   `auth`, `media`, `ui`, `navigation`, `location`, `key`, `sample`.
   Each file declares per-method aliases that default the facility
   (e.g. `var log = (m, tag = "sync") => Logger.log(m, tag);`),
   so call sites stay terse and per-call override is still possible.
5. Add `Logger.subscribe({ facility, minLevel }, cb)` so reactive UI
   surfaces can observe new log entries without coupling to any sink.
   *Done.*
6. Switch SyncFeedback's "Show Logs" pane to
   `LogRepository.query({ facility: 'sync', minLevel: 'info' })` for
   the initial render and `Logger.subscribe()` for live updates;
   delete the legacy ring-buffer paths from `Logger.js`. *Done.*

All six steps complete — `Logger.js` is now a thin dispatcher, all
destinations are pluggable sinks, and the SyncFeedback pane reads
from persisted storage so it survives background/resume.
