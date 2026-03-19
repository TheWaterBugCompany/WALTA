# Test Guide

## Which test level to use

| Change type | Use |
|-------------|-----|
| Logic in `lib/logic/` or `lib/util/` that doesn't call `Ti.*` APIs | Node.js unit tests (`test/*_spec.js`) |
| Logic that calls `Ti.*` APIs and can't be mocked | Device unit tests (`walta-app/app/assets/unit-test/`) |
| Full user flow across multiple screens | End-to-end tests (`end-to-end-testing/`) |
| Product acceptance criteria | BDD acceptance tests (`features/`) |

Node.js unit tests are fastest — prefer them wherever `Ti.*` can be avoided or mocked.

## Running a subset of tests

Add `.only` to a `describe` or `it` block:

```javascript
describe.only("My module", function() { ... });
it.only("does the thing", function() { ... });
```

Remove `.only` before committing.

## Mocking Ti.* in Node.js tests

The Node.js runtime has no Titanium. To test modules that use `Ti.Network.createHTTPClient`, inject a fake via the module-level `ProxyCreateHTTPClient` export. See `test/CerdiApi_spec.js` for the canonical pattern — it defines `ProxyCreateHTTPClient` to simulate HTTP responses without a real network.

`mocha-bootstrap.js` is only needed for on-device tests; do not require it in Node.js specs.

## Known gaps

- No unit tests for `KeyLoaderInk.js`, `Navigation.js`, or `SampleSync.js`
- No tests for any controller in `walta-app/app/controllers/` (Alloy controllers depend on a live Titanium runtime)
