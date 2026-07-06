# Contract tests

`contract-tests/CerdiApi_spec.js` exercises `walta-app/app/lib/logic/CerdiApi.js` against the **real** CERDI sandbox API at `api-sandbox.waterbugblitz.org.au/v1`. The aim is to verify that our client code agrees with the live API — not to mock it.

Distinct from the other test layers:

| Layer | Mock or real? | Runs in CI? |
|---|---|---|
| `test/` (Node unit) | Mocked dependencies | Yes |
| `walta-app/app/spec/` (device unit) | Mocked `Ti.*` | Yes |
| `features/` (Cucumber acceptance) | Real Appium, mock CERDI server | Yes |
| `end-to-end-testing/` (Appium integration) | Real Appium, mock CERDI server | Yes (both platforms, on relevant changes) |
| **`contract-tests/` (this directory)** | **Real CERDI sandbox API** | **No** |

## How it works

The spec mocks `Ti.Network.createHTTPClient` with `ProxyCreateHTTPClient`, which preserves Titanium's `client.{open, setRequestHeader, send, getAllResponseHeaders, getResponseHeader}` shape but forwards each call through the global `fetch` API to the real sandbox. The production `CerdiApi.js` runs unchanged — only its HTTP transport is swapped at the boundary.

The suite shares one `RateLimitPacer` (via `createCerdiApi(url, secret, { pacer })`) and gates every network call through `acquire()` before it fires, so it observes CERDI's per-IP rate limit and doesn't trip the "Too Many Attempts" throttle.

When `CerdiApi.js` adds a new `Ti.Network` method call, the proxy needs the matching method added too — keep the two in sync, or the suite fails with `client.<method> is not a function`.

## Running

```bash
npx grunt contract-test
```

Requires network access to `api-sandbox.waterbugblitz.org.au` and a test account on the sandbox (`testlogin@example.com` / `tstPassw0rd!` is what the existing tests use). Run time is around 2 minutes against a healthy sandbox.

## Expected output (as of 2026-07-02)

- 22 passing, 0 pending, 0 failing against a healthy sandbox.

The image-comparison tests are active and assert fidelity via the shared jimp
colour-histogram helper (`features/support/image-test.js`). Two previously
tracked failures — token-expiration timing and an unknown-creature count drift
— no longer reproduce. The token-expiration tests use fake timers and stay
timing-sensitive, so an occasional flake there is a machine-speed artefact, not
a contract break.

Run to investigate the sandbox; not part of regular CI because the suite would hammer CERDI's sandbox on every push.

## Out of scope

- Adding to CI. The point of contract tests is to surface assumption mismatches against the live API; running on every push would be slow + noisy.
