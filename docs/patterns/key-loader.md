# `KeyLoader*.js` — taxonomy data loaders

Three loaders for different taxonomy data formats:

- `KeyLoaderInk.js` — **canonical format going forward.** Reads compiled Ink JSON.
- `KeyLoaderXml.js` — legacy.
- `KeyLoaderJson.js` — legacy.

The Ink loader walks the compiled Ink runtime graph, evaluating containers and following choice branches to reconstruct the key tree into `Key`, `Question`, and `Taxon` objects.

The root Ink container has two top-level branches:

- `"ALT Key"` — the dichotomous key.
- Several speedbug indexes: `"Speedbug"`, `"Mayfly Muster Speedbug"`, `"Order Speedbug"`.
