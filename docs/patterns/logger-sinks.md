# Logger — sink-based dispatch

`Logger` is a thin dispatcher in front of pluggable sinks. Each call site
hands `Logger` a level and a message; `Logger` formats an entry and
forwards it to every registered sink. The sinks decide what to do with
it (write to console, ship to Bugfender, append to an in-memory ring
buffer for the in-app log pane, persist to SQLite, …).

## Why

- **Silent by default in tests.** With zero sinks registered, logging is
  a no-op. App startup configures whichever sinks are appropriate; tests
  register none, or a capturing test sink.
- **Pluggable persistence.** Adding a new destination (e.g. SQLite for
  surviving background/resume) is a new sink, not another inline branch
  in every `Logger` method.
- **Per-sink filtering.** The in-app SyncFeedback "Show Logs" pane wants
  a noise-filtered view (`level=info AND facility=sync`), while
  Bugfender/SQL want everything. Filters live on the sink, not in
  `Logger`.

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

## Levels

`debug`, `trace`, `info`, `warn`, `error`. All five fan out to every
registered sink; per-sink filters are how a sink narrows what it
records.

## Facility taxonomy

Every entry carries a `facility` string in addition to its level (e.g.
`sync`, `auth`, `key-loader`, `ui`). Sinks can filter on facility — the
SyncFeedback pane uses `level=info AND facility=sync` to stay readable.

## Migration status (WB-64)

This refactor is being landed incrementally. Order:

1. Sink dispatcher + `addSink` (foundation).
2. Migrate the existing hardcoded sinks (`ConsoleSink`, `BugfenderSink`,
   `RingBufferSink`) onto the sink interface.
3. Add `SqlSink` for log persistence across background/resume.
4. Add `Logger.info()` and the facility taxonomy across ~38 files.
5. Configure `RingBufferSink`'s filter so the SyncFeedback pane shows
   `level=info AND facility=sync`.

Until step 2 lands, the legacy Bugfender / `Ti.API` / ring-buffer paths
in `Logger.js` remain in place alongside the new sink dispatch.
