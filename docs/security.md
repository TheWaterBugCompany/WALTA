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

## Checking whether a package actually ships

Grep `walta-app/app/` for a `require()` of it, and grep the compiled
`walta-app/Resources/` tree. Two false positives have cost time and will again:

- **`form-data`** appears in `Resources/.../CerdiApi.js` — as the MIME string
  `"multipart/form-data"`. The app speaks HTTP through `Ti.Network`, not through any
  npm HTTP client.
- **`js-yaml`** appears in `Resources/.../spec/lib/mocha.js` — inside a `package.json`
  fragment bundled into mocha itself. That file is the test harness and is not in a
  release build either way.

A string match is not a dependency. Confirm with `npm ls <package>` that something in
the app's own require graph pulls it, not just that the name appears in bundled text.

## Build-time-only packages

Everything not listed above is a build or test transitive. The clusters shift as the
tree moves, so what matters is not the list but where each one enters from — and
every one of them enters through the toolchain, never through `walta-app/app/`:

| Package | Enters through | Why it can't just be bumped |
|---|---|---|
| `undici` | `node-gyp`, `titanium` | Nested copies; lifting them needs the parents to move |
| `@babel/core` (7.11.x) | `node-titanium-sdk` | The Titanium SDK bundles its own core — see the blockers below |
| `form-data` (2.x) | `liveview → node-titanium-sdk → node-appc → request` | `request` is deprecated and unmaintained; it leaves when `node-titanium-sdk` does |
| `shell-quote` | `@appium/support`, `teen_process` | Held with the Appium driver majors |
| `ip-address` | `socks` | Deep transitive of the Appium tree |
| `brace-expansion` | `minimatch` | Several majors coexist in the tree |
| `extract-zip` | Puppeteer/Appium tree | **No patched version published** |
| `vite` | LiveView fast-iteration | Pinned to 4.x deliberately — see the blockers below |

None of these packages are bundled into the device app. The risk surface is "a malicious peer dependency could compromise a developer machine during install/build", which is mitigated by:
- `npm install --ignore-scripts` in CI (see `ci.yml`)
- No CI secrets accessible during `install.sh` — build secrets are injected at signing time only

## Maintenance policy

1. **Dependabot grouped PRs land routinely.** The repo has Dependabot configured to open weekly grouped dev-dependency PRs (see `commit 54ac956c`). Merge these as they come.
2. **Track major-version blockers as their own scoped tasks.** These are held back in `.github/dependabot.yml` and need scoped upgrade work rather than a routine bump:
   - `vite` (pinned to 4.x — 5+ is ESM-only, breaks `require('vite')` in the LiveView config)
   - `chai` (capped at 4.x — 6 is ESM-only, breaks the device unit-test runner)
   - `@babel/preset-env` (held at 7.x — 8 needs `@babel/core` 8, but the bundled Titanium SDK ships an older core, so the native build's babel pass fails with `api.targets is not a function`)
   - the Appium driver majors (`appium-uiautomator2-driver` <8, `appium-xcuitest-driver` <12 — the majors are ESM-only and change driver behaviour; need a harness/acceptance verification pass)
   - `Bugfender SDK` (2019-era module + bundled SDK)
3. **Dismiss inapplicable alerts in the GitHub UI with a comment linking here**, so the dashboard reflects actual risk rather than transitive-tree noise. The dismissal options to use:
   - **Vulnerable code is not actually used** — for `@xmldom/xmldom` (no serializer use) and `underscore` (no `_.template/flatten/isEqual` use).
   - **Vulnerability is in tests/build pipeline only** — for everything in the build-time-only cluster.
4. **Re-run this triage after major toolchain bumps.** A Titanium SDK upgrade, an Appium upgrade, or replacing `liveview` could shift the tree enough to invalidate the analysis.
