# Security — Dependabot triage

GitHub Dependabot scans `package-lock.json` and reports advisories against any npm package in the tree. For a Titanium project, raw advisory counts overstate the actual runtime risk because most npm dependencies are build-time tools — they never reach the device.

This doc records the standing classification so future triage rounds don't have to re-derive it.

## Why Dependabot's `scope: runtime` ≠ Titanium runtime

Dependabot uses npm's notion of scope:
- `scope: runtime` ⇔ listed under `dependencies` in `package.json`
- `scope: development` ⇔ listed under `devDependencies`

But WALTA's `dependencies` include build tools (`alloy`, `titanium`, `liveview`, `appium*`, `node-titanium-sdk`, …) — they're not `devDependencies` because the build expects them at the same install layer as the app sources. These are still build-time-only from a security perspective.

**What actually ships in the Ti app is whatever `walta-app/app/**/*.js` directly `require()`s, plus its transitive imports.** The compiled output under `walta-app/Resources/` is the source of truth — anything not there has zero runtime exposure.

## Runtime-bundled npm packages

Grep of `walta-app/app/` `require()` calls returns exactly two vulnerable-flagged packages:

| Package | Requires | Bundled version | Affected by alerts? |
|---|---|---|---|
| `@xmldom/xmldom` | 1 (`util/XmlUtils.js`) | `0.9.10` (latest published) | **No** — see below |
| `underscore` | 13 (across `lib/logic/`, `lib/util/`) | `1.8.3` (vendored at `walta-app/app/lib/lib/underscore.js`) | **No** — see below |

### `@xmldom/xmldom`

All 8 currently-open advisories (`GHSA-2v35-w6hq-6mfw`, `GHSA-f6ww-3ggp-fr8h`, `GHSA-x6wf-f3px-wcqx`, `GHSA-j759-j44w-7fr8`, `GHSA-wh4c-j3r5-mjhp`, …) describe injection or DoS via the **XMLSerializer** path. WALTA only uses **`DOMParser.parseFromString()`** for reading taxonomy XML — the serializer is never instantiated. Not exploitable.

### `underscore`

The two material CVEs are:

- `GHSA-cf4h-3jhx-xvhq` (critical) — Arbitrary Code Execution via `_.template()` with attacker-controlled input.
- `GHSA-qpx9-hpmf-5gmw` (high) — Unlimited recursion in `_.flatten` and `_.isEqual`, DoS via deeply-nested input.

A full grep of `walta-app/app/` for `_.` calls returns zero uses of `_.template`, `_.flatten`, or `_.isEqual`. Only safe APIs are used (`_.each`, `_.map`, `_.find`, `_.filter`, `_.pick`, …) — these have no known CVEs in any underscore version. Not exploitable.

The vendored 1.8.3 file is dated 2015, which is a hygiene concern independent of the alerts (and a candidate for a separate cleanup PR — bump to 1.13.x to match npm). It is *not* a security issue because the vulnerable surface isn't called.

## Build-time-only packages

The remaining ~65 alerts fall into these clusters, ordered by alert count:

- **`xmldom` (legacy, 7 alerts)** — pulled in by `liveview → alloy-compiler` and `node-titanium-sdk`. Build-time only.
- **`elliptic` (7)** — dev-tree crypto. Build-time only.
- **`vite` (5)** — used by LiveView fast-iteration. We are pinned to 4.x (5+ is ESM-only and breaks `require('vite')` in the LiveView config). Build-time only.
- **`qs` (3), `undici` (3)** — HTTP request internals used by Appium / build tooling. Build/test only.
- **`ansi-regex`, `ejs`, `express`, `lodash`, `minimatch`, `semver`, `serialize-javascript`, `tmp` (2 each)** — all build/test transitives.
- **18 single-alert packages** (`body-parser`, `browserify-sign`, `cipher-base`, `cookie`, `esbuild`, `eventsource`, `form-data`, `images`, `js-yaml`, `json-schema`, `lodash.set`, `node-extend`, `react-dev-utils`, `request`, `send`, `serve-static`, `tough-cookie`, `uuid`, `xml2js`, `yauzl`) — all build/test transitives, none reachable from `walta-app/app/`.

None of these packages are bundled into the device app. The risk surface is "a malicious peer dependency could compromise a developer machine during install/build", which is mitigated by:
- `npm install --ignore-scripts` in CI (see `ci.yml`)
- No CI secrets accessible during `install.sh` — build secrets are injected at signing time only

## Maintenance policy

1. **Dependabot grouped PRs land routinely.** The repo has Dependabot configured to open weekly grouped dev-dependency PRs (see `commit 54ac956c`). Merge these as they come.
2. **Track major-version blockers as their own scoped tasks.** `vite` (pinned to 4.x), `Bugfender SDK` (2019-era module + bundled SDK), `chai` (capped at 4.x — 6 is ESM-only and breaks the device unit-test runner) — these need scoped upgrade work and don't belong in a sweeping audit.
3. **Dismiss inapplicable alerts in the GitHub UI with a comment linking here**, so the dashboard reflects actual risk rather than transitive-tree noise. The dismissal options to use:
   - **Vulnerable code is not actually used** — for `@xmldom/xmldom` (no serializer use) and `underscore` (no `_.template/flatten/isEqual` use).
   - **Vulnerability is in tests/build pipeline only** — for everything in the build-time-only cluster.
4. **Re-run this triage after major toolchain bumps.** A Titanium SDK upgrade, an Appium upgrade, or replacing `liveview` could shift the tree enough to invalidate the analysis.
