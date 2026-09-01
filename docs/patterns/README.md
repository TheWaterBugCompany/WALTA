# Patterns

Architectural patterns and module summaries for the WALTA codebase. Each file is a single, independently-linkable concern. New patterns get a new file rather than a new section in an existing one — small files are fine.

## Conventions

- [screen-plumbing.md](screen-plumbing.md) — how a tap turns into a screen change: Topics, Navigation, View, `Main.js` bootstrap, per-controller lifecycle, `$.args` over `Alloy.Globals`, `Ti.App.Properties` registry, `System.js` OS wrapper
- [screen-controllers.md](screen-controllers.md) — the Titanium-free `lib/mvvm/controllers/<name>` screen-controller tier: builds the VM, `bindView`s it, routed by `View` for windows and modals alike (MVVMC, the portable tier)
- [modals.md](modals.md) — opening overlay modals via `Navigation.openModal` + the modal-specific overlay glue
- [viewmodels.md](viewmodels.md) — MVVM convention: ViewModel class shape, `bindView` (incl. `twoWay` inputs), semantic palette colours via Symbols
- [toolbar-buttons.md](toolbar-buttons.md) — anchor bar / `NavButton` pattern
- [photo-paths.md](photo-paths.md) — relative vs absolute path conventions for user vs reference images
- [repository-pattern.md](repository-pattern.md) — non-Alloy persistence: the Repository pattern (returns domain models from `lib/models/`), `Migrator`, migration file convention, shared vs isolated dbs
- [visual-regression.md](visual-regression.md) — on-device `toImage()` screenshot capture, settle gate, pixel-diff vs committed baselines, the `visual-test` task
- [window-orientation.md](window-orientation.md) — holding a window to the orientation the interface is already in, so Titanium does not force-rotate it a half turn on cold launch
- [anchor-bar-insets.md](anchor-bar-insets.md) — why the anchor bar grows on Android: the home-gesture strip swallows touches and is deeper than the safe area reports

## Module summaries

- [cerdi-api.md](cerdi-api.md) — `CerdiApi.js` HTTP client, two-token auth model
- [key-loader.md](key-loader.md) — `KeyLoader*.js` taxonomy data loaders
- [sample-uploader.md](sample-uploader.md) — `SampleUploader.js` sequential upload + photo optimisation
- [logger-sinks.md](logger-sinks.md) — `Logger` sink-based dispatch: pluggable sinks, fire-and-forget, per-sink filters
