# Contract tests

`contract-tests/CerdiApi_spec.js` exercises `walta-app/app/lib/logic/CerdiApi.js` against the **real** CERDI sandbox API at `api-sandbox.waterbugblitz.org.au/v1`. The aim is to verify that our client code agrees with the live API — not to mock it.

Distinct from the other test layers:

| Layer | Mock or real? | Runs in CI? |
|---|---|---|
| `test/` (Node unit) | Mocked dependencies | Yes |
| `walta-app/app/spec/` (device unit) | Mocked `Ti.*` | Yes |
| `features/` (Cucumber acceptance) | Real Appium, mock CERDI server | Yes |
| `end-to-end-testing/` (Appium integration) | Real Appium, mock CERDI server, dormant | No (revival = WB-104) |
| **`contract-tests/` (this directory)** | **Real CERDI sandbox API** | **No** |

## How it works

The spec mocks `Ti.Network.createHTTPClient` with `ProxyCreateHTTPClient`, which preserves Titanium's `client.{open, setRequestHeader, send, getAllResponseHeaders, getResponseHeader}` shape but forwards each call through the `request` npm package to the real sandbox. The production `CerdiApi.js` runs unchanged — only its HTTP transport is swapped at the boundary.

When `CerdiApi.js` adds a new `Ti.Network` method call, the proxy needs the matching method added too. See WB-154 (2026-06-09) for the history of letting that drift.

## Running

```bash
npx grunt contract-test
```

Requires network access to `api-sandbox.waterbugblitz.org.au` and a test account on the sandbox (`testlogin@example.com` / `tstPassw0rd!` is what the existing tests use). Run time is around 2 minutes against a healthy sandbox.

## Expected output (as of 2026-06-09, post-WB-154)

- 15 passing
- 3 pending (`it.skip`ped image-comparison tests — see WB-92 for the missing pixelmatch wiring)
- 3 failing — known pre-existing issues each tracked separately:
  - WB-156 — `#obtainAccessToken` token-expiration tests time out under `sinon.useFakeTimers` + `nock`
  - WB-157 — `should update unknown creatures` count drift (15 expected, 6 returned)

Run to investigate the sandbox; not part of regular CI because the suite would hammer CERDI's sandbox on every push.

## Out of scope

- Migrating off `request` (deprecated). Tracked separately under WB-153 follow-up — only safe to do once this suite is reliably green so the refactor has a baseline to compare against.
- Adding to CI. The point of contract tests is to surface assumption mismatches against the live API; running on every push would be slow + noisy.
