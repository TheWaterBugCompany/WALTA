# `CerdiApi.js` — HTTP client for the CERDI backend

Two-token auth model:

- **App-level OAuth token** (`appAccessTokenLive`), obtained via `client_secret`, scoped to `create-users`. Cached with TTL checking.
- **Per-user token** (`userAccessTokenLive`), obtained at login, stored persistently.

All HTTP is done via `Ti.Network.createHTTPClient`. Photos are uploaded as `multipart/form-data`; everything else is JSON.

**Mocking pattern for Node tests:** inject a fake via the module's `ProxyCreateHTTPClient` export — see `test/CerdiApi_spec.js` for the canonical shape.
