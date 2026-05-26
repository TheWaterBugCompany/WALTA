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
- **Per-sink level filter.** Each sink declares which levels it accepts
  via its own `levels` allowlist; the allowlist lives on the sink, not in
  `Logger`. All five levels currently fan out to every sink — including
  `debug`, which `SqlSink` persists for the diagnostics export and
  `BugfenderSink` ships remotely so crash breadcrumbs are visible on the
  dashboard (debug is still suppressed entirely on `development` builds via
  `bugfenderEnabled`).
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
or above a threshold. Ordering: `trace < debug < info < warn < error`.

## Facility taxonomy

Every entry carries a `facility` string in addition to its level
(`sync`, `auth`, `media`, `ui`, `navigation`, `location`, `key`,
`sample`). Consumers slice on facility — the
SyncFeedback pane queries `LogRepository` with `facility=sync,
minLevel=info` for prior-run history, and subscribes via
`Logger.subscribe()` with the same filter for live updates.

