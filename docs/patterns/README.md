# Patterns

Architectural patterns and module summaries for the WALTA codebase. Each file is a single, independently-linkable concern. New patterns get a new file rather than a new section in an existing one — small files are fine.

## Conventions

- [controller-communication.md](controller-communication.md) — Topics pub/sub bus
- [controller-lifecycle.md](controller-lifecycle.md) — `$.args` injection and `cleanUp()`
- [no-alloy-globals.md](no-alloy-globals.md) — pass shared state explicitly, never via `Alloy.Globals`
- [photo-paths.md](photo-paths.md) — relative vs absolute path conventions for user vs reference images
- [ti-app-properties.md](ti-app-properties.md) — persistent storage key registry
- [viewmodels.md](viewmodels.md) — MVVM convention: ViewModel class shape, `bindView`, semantic palette colours via Symbols
- [toolbar-buttons.md](toolbar-buttons.md) — anchor bar / `NavButton` pattern

## Module summaries

- [cerdi-api.md](cerdi-api.md) — `CerdiApi.js` HTTP client, two-token auth model
- [key-loader.md](key-loader.md) — `KeyLoader*.js` taxonomy data loaders
- [sample-uploader.md](sample-uploader.md) — `SampleUploader.js` sequential upload + photo optimisation
- [navigation.md](navigation.md) — `Navigation.js` history stack, screen GC
