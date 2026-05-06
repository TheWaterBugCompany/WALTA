# Patterns

Architectural patterns and module summaries for the WALTA codebase. Each file is a single, independently-linkable concern. New patterns get a new file rather than a new section in an existing one — small files are fine.

## Conventions

- [screen-plumbing.md](screen-plumbing.md) — how a tap turns into a screen change: Topics, Navigation, View, `Main.js` bootstrap, per-controller lifecycle, `$.args` over `Alloy.Globals`, `Ti.App.Properties` registry, `System.js` OS wrapper
- [viewmodels.md](viewmodels.md) — MVVM convention: ViewModel class shape, `bindView`, semantic palette colours via Symbols
- [toolbar-buttons.md](toolbar-buttons.md) — anchor bar / `NavButton` pattern
- [photo-paths.md](photo-paths.md) — relative vs absolute path conventions for user vs reference images

## Module summaries

- [cerdi-api.md](cerdi-api.md) — `CerdiApi.js` HTTP client, two-token auth model
- [key-loader.md](key-loader.md) — `KeyLoader*.js` taxonomy data loaders
- [sample-uploader.md](sample-uploader.md) — `SampleUploader.js` sequential upload + photo optimisation
- [logger-sinks.md](logger-sinks.md) — `Logger` sink-based dispatch: pluggable sinks, fire-and-forget, per-sink filters
