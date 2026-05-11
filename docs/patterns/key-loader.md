# `KeyLoader*.js` — taxonomy data loaders

Three loaders, two roles: **build-time** (Ink → JSON) and **runtime** (JSON → live `Key` tree).

## Pipeline

```
walta-taxonomy/walta/key.ink                ← source, authored in Inky (Inkle GUI editor)
   │  ./ink/inklecate/.../inklecate         (exec:build_key_ink in Gruntfile)
   ▼
walta-taxonomy/walta/key.ink.json           ← Inkle runtime format (intermediate)
   │  KeyLoaderInk.loadKey() + CircularJSON (grunt task: build-key-from-ink-json)
   ▼
walta-taxonomy/walta/key.json               ← serialised Key tree
   │  bundled into walta-app/Resources/.../taxonomy/walta/
   │  KeyLoaderJson.loadKey()               (app startup, controllers/index-app.js:78)
   ▼
Alloy.Globals.Key                           ← live in memory
```

Run the full pipeline: `npx grunt build-key`. (Also part of `build-misc`.)

## The loaders

- `KeyLoaderInk.js` — **build-time only.** Walks the Inkle runtime graph, evaluates choice branches, and emits a `Key` / `Question` / `Taxon` tree which is then serialised to `key.json` via `CircularJSON`. No dedicated spec; the implicit smoke test is that the resulting `key.json` lets the app launch and the dichotomous key behaves correctly in features.
- `KeyLoaderJson.js` — **runtime.** Reads `key.json` via `CircularJSON.parse` and rehydrates the prototypes back into `Key` / `Question` / `Taxon` instances. Exercised by [Main_spec.js](../../walta-app/app/spec/Main_spec.js) and [TaxonList_spec.js](../../walta-app/app/spec/TaxonList_spec.js), which load test-fixture keys.
- `KeyLoaderXml.js` — legacy XML loader, retained for the old key format. See [KeyLoaderXml_spec.js](../../walta-app/app/spec/KeyLoaderXml_spec.js).

## Ink structure

The root Ink container has two top-level branches the build-time loader consumes:

- `"ALT Key"` — the dichotomous decision tree.
- Speedbug indexes: `"Speedbug"`, `"Mayfly Muster Speedbug"`, `"Order Speedbug"`.

## Why three formats

`.ink` is the authoring format — human-readable, GUI-editable in Inky, but not loadable at runtime. `.ink.json` is what `inklecate` compiles `.ink` into — an inkle VM format that requires script evaluation to walk, not directly app-loadable. `.json` is the pre-evaluated `Key` tree the runtime can load cheaply (just rehydration of prototypes).
