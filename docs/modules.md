# Key Module Summaries

Narrative summaries of the load-bearing `lib/` modules. Read these before changing them — most have non-obvious sequencing or shared-state caveats that won't be apparent from the code alone.

## `CerdiApi.js` — HTTP client wrapper for the CERDI backend

Two-token auth model:

- **App-level OAuth token** (`appAccessTokenLive`), obtained via `client_secret`, scoped to `create-users`. Cached with TTL checking.
- **Per-user token** (`userAccessTokenLive`), obtained at login, stored persistently.

All HTTP is done via `Ti.Network.createHTTPClient`. Photos are uploaded as `multipart/form-data`; everything else is JSON.

**Mocking pattern for Node tests:** inject a fake via the module's `ProxyCreateHTTPClient` export — see `test/CerdiApi_spec.js` for the canonical shape.

## `KeyLoader*.js` — Taxonomy data loaders

Three loaders for different taxonomy data formats:

- `KeyLoaderInk.js` — **canonical format going forward.** Reads compiled Ink JSON.
- `KeyLoaderXml.js` — legacy.
- `KeyLoaderJson.js` — legacy.

The Ink loader walks the compiled Ink runtime graph, evaluating containers and following choice branches to reconstruct the key tree into `Key`, `Question`, and `Taxon` objects.

The root Ink container has two top-level branches:

- `"ALT Key"` — the dichotomous key.
- Several speedbug indexes: `"Speedbug"`, `"Mayfly Muster Speedbug"`, `"Order Speedbug"`.

## `SampleUploader.js` — Sample sync (upload side)

Uploads samples sequentially. For each sample:

1. Submit/update the sample record.
2. Upload the site photo.
3. Upload taxa photos.
4. Upload unknown-creature records (with photos).
5. Delete any pending-delete unknown creatures.

**Photo optimisation before upload** (via `PhotoUtils`):

- Anything over 4 MB is resized to max 1600 px wide.
- On iOS, PNG files are converted to JPEG **first** — PNG→JPEG reduces memory pressure during resize, working around a known intermittent corruption issue.

A `delay` parameter threads through all upload calls to rate-limit requests.

## `Navigation.js` — Screen history stack

Maintains a history stack of `{ ctl, args }` entries. Behaviour:

- **`openController()`** calls `garbageCollectControllers()` first. If the target screen is already in history (matched by controller name + node id), everything above that point is truncated and a `PAGES_UNLOADED` topic is fired. This prevents the user from building up navigation loops.
- **Unsaved-changes prompt:** if a `SiteDetails` screen is in the truncated range and has unsaved changes, the user is prompted to discard or submit before navigation proceeds.
- **`goBack()`** re-opens the second-to-last entry — *not* a native back gesture; the whole screen is re-rendered.
