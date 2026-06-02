# `KeyLoader*.js` — taxonomy data loaders

Two loaders, two roles: **build-time** (`.ink` source → `key.json`) and **runtime** (`key.json` → live `Key` tree).

## Pipeline

```
walta-taxonomy/walta/key.ink                ← source, authored in Inky (Inkle GUI editor)
walta-taxonomy/walta/taxa.ink               ← INCLUDE'd by key.ink; one knot per taxon
   │  KeyLoaderInk.loadKey()                (grunt task: build-key-from-ink)
   │  + CircularJSON.stringify
   ▼
walta-taxonomy/walta/key.json               ← serialised Key tree
   │  bundled into walta-app/Resources/.../taxonomy/walta/ via the
   │  walta-app/app/assets/taxonomy/walta → walta-taxonomy/walta symlink
   │  KeyLoaderJson.loadKey()               (app startup, controllers/index-app.js)
   ▼
Alloy.Globals.Key                           ← live in memory
```

Run the full pipeline: `npx grunt build-key`. That runs `build-key-from-ink` (parse + emit) then `verify-media` (every `mediaUrls` / `bluebug` path must resolve to a file under `walta-taxonomy/walta/media/`).

## Prerequisites

`npm install` is the only setup step. The build-time parser is pure Node — no `.NET`, no `inklecate` binary, no `ink` git submodule. (The empty `ink/` directory and `.gitmodules` entry are tracked for removal under WB-80 along with the other legacy `walta-taxonomy/` scripts.)

## The loaders

- `KeyLoaderInk.js` — **build-time only.** Reads `key.ink` (resolving `INCLUDE` directives), tokenises lines into knots / choices / tags, and emits a `Key` / `Question` / `Taxon` / `SpeedbugIndex` tree which is then serialised to `key.json` via `CircularJSON`. The implicit smoke test is that the resulting `key.json` lets the app launch and the dichotomous key behaves correctly in features; `verify-media` adds a build-time check that every media reference resolves.
- `KeyLoaderJson.js` — **runtime.** Reads `key.json` via `CircularJSON.parse` and rehydrates the prototypes back into `Key` / `Question` / `Taxon` instances. Exercised by [Main_spec.js](../../walta-app/app/spec/Main_spec.js) and [TaxonList_spec.js](../../walta-app/app/spec/TaxonList_spec.js), which load test-fixture keys.
- `KeyLoaderXml.js` — legacy XML loader, retained for the old key format. See [KeyLoaderXml_spec.js](../../walta-app/app/spec/KeyLoaderXml_spec.js).

## Ink subset

WALTA uses only a tiny slice of Ink: knots (`=== name ===`), choices (`*`, `**`, `***`) with optional `# tag` and `-> divert`, standalone-line `# name: value` tags inside taxon knots, `INCLUDE`, and `//` / `/* */` comments. No variables, no logic, no string interpolation. The build-time loader is a single-file line parser, not an Inkle bytecode walker.

Tag forms accepted on a choice:
- `* text # name: value -> destination` (canonical / Inky-friendly)
- `* text -> destination # name: value` (older form; some existing `key.ink` lines still use this)

Tag content is parsed as JSON when possible (so `["a","b"]` becomes an array, `"foo"` becomes a string, numbers stay numbers); on parse failure the raw string is preserved.

## Tree shape

The `key.ink` root content is the entry-point menu — five top-level choices:

- `"ALT Key"` → the dichotomous decision tree. After load, this knot becomes the actual root of the `Key`; the menu wrapper is detached.
- `"Speedbug"`, `"Mayfly Muster Speedbug"`, `"Order Speedbug"` → flattened into `SpeedbugIndex` objects attached to the key. Each group's first sub-choice must be `Not sure` (its divert names the group); the remaining sub-choices map silhouette `mediaUrls` to taxon knot ids.
- `"Mayfly start point"` → currently unused.

Each taxon knot lives in `taxa.ink` and is a sequence of `# name: value` tags terminated by `-> DONE`. The `taxonId` tag marks the knot as a `Taxon` (vs a `KeyNode`); the remaining tags become attributes (`scientificName`, `mediaUrls`, `bluebug`, etc.).

## Editing the data

- A wrong / missing silhouette → edit the taxon's `# bluebug:` line in `taxa.ink`.
- A new question step → add a knot in `key.ink`, divert to it from the parent choice.
- A new taxon → add a knot in `taxa.ink` with the tags, and divert to its name from the appropriate parent in `key.ink`.

Run `npx grunt build-key` after any change. `verify-media` will fail the build if a reference points to a missing file. Commit the regenerated `key.json` alongside the `.ink` edits.
