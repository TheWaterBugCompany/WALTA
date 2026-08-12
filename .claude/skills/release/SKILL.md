---
name: release
description: Cut a WALTA release. Two GitHub Actions — `upload-build.yml` (build + sign + push a candidate to the beta channels: Play Open Testing / TestFlight, and tag the SHA) and `release-to-production.yml` (promote an already-beta-tested build to the PUBLIC App Store + Play production track). Load when the user asks to release, push a beta, cut a build for testers, bump the version, or promote a build to the public stores.
user-invocable: true
allowed-tools:
  - Bash
  - Read
---

# Cutting a release (WALTA)

WALTA has **two** release actions, deliberately separate:

1. **`upload-build.yml`** — *build + push to the beta channel* (TestFlight groups + Play Open Testing / internal), then tag the SHA. This is what "release" has historically meant here; it produces the candidate testers try. See **Beta builds** below.
2. **`release-to-production.yml`** — *promote an already-beta-tested build to the PUBLIC stores* (App Store review + Play production track). **No rebuild** — it ships the exact bytes testers ran. See **Promoting to production** below.

The normal flow: `upload-build.yml` with `environment=production` → testers exercise it on Open Testing / external TestFlight → `release-to-production.yml` promotes that same build to the public.

## The discipline: use the workflow, not local builds

Release builds — anything going to a store or a tester — go through these Actions, never a local build-and-upload. They own version computation, signing secrets, store upload, and tagging. Local builds are for device/simulator testing only.

---

# Beta builds (`upload-build.yml`)

## Trigger

**Default to `environment=test`.** Always pass `-f environment=test` unless the user has *explicitly* asked for a production build ("ship to prod", "production build", "real users", or similar). A wrong-environment build wastes a build number, surprises the tester pool, and (production → real CERDI) can pollute live data.

```bash
# Default — test environment, both platforms, auto-incremented version
gh workflow run upload-build.yml -f environment=test

# Production candidate — only when the user explicitly asks
gh workflow run upload-build.yml -f environment=production

# Explicit (all fields optional, but always pass environment)
gh workflow run upload-build.yml \
  -f environment=test \
  -f platforms=both \
  -f version=               # leave empty to auto-increment
```

Then poll the run:

```bash
gh run list --workflow=upload-build.yml --limit=3
gh run watch <run-id>        # streams the job log
```

## Inputs

| Input | Default | Notes |
|---|---|---|
| `environment` | `production` (workflow default — **override to `test` unless explicitly told to ship prod**) | `production` = real CERDI API + clean `v<version>` tag. `test` = sandbox CERDI + `v<version>-test` tag, version suffixed `-test` on Android (iOS can't carry the suffix — Apple rejects non-integer `CFBundleVersion`). |
| `platforms` | `both` | `android`, `ios`, or `both`. Use single-platform when one job failed and the other succeeded — the tag-create step skips if the tag already exists, so a retry won't conflict. |
| `version` | empty | Empty = auto-increment the build number from the latest `v*` tag (production *and* test share one build-number sequence so they never collide). Set explicitly only for a specific version (e.g. major bump). Format: `major.minor.patch.build` (e.g. `2.0.5.1`). |
| `skip_ci_gate` | `false` | Skips the requirement that the latest `ci.yml` run on the release SHA succeeded. Use **only** when CI is red for a known unrelated reason (e.g. an intermittent flake) and you've manually verified the build. |

## What it does

1. **CI gate** — refuses to build a SHA whose latest `ci.yml` run didn't succeed. Bypass with `skip_ci_gate=true` only after manual verification.
2. **Compute version** — auto-increments from `git tag -l 'v*' --sort=-v:refname | head -1`, or uses the explicit `version` input. Fallback base when no tags exist: `2.0.4.0`.
3. **Android build** — bumps `tiapp.xml.template`, writes app-config (prod or test sandbox), builds the signed `.aab`, uploads to Google Play (status `completed`) — **Open Testing (`beta` track)** for production, **internal** for test.
4. **iOS build** — builds the signed `.ipa`, `fastlane pilot upload --skip_waiting_for_build_processing true` (upload and exit), then a chained `distribute-testflight.yml` job waits out Apple processing and assigns the build to its TestFlight group (Sandbox Api Testers for test, Production Api Testers for production). Uploading and distributing are split so the macOS job isn't held through Apple's processing (which used to cancel it at the timeout).
5. **Tag release** — pushes an annotated `v<version>` (or `v<version>-test`) tag. Skips silently if the tag already exists on the remote, supporting single-platform retries at the same version.

Concurrency `group: upload-build, cancel-in-progress: false` — one build at a time; a second queues rather than killing the first.

To change tester-facing TestFlight notes, edit `.github/whats-to-test.md` before the run.

## Post-upload checks

- **Android**: production appears in Play Console → Open testing (test builds → Internal testing) within ~10 min. Open-testing testers join via the opt-in link (`https://play.google.com/apps/testing/net.thewaterbug.waterbug`). A *new* Open-testing release can sit in review before it's downloadable; internal builds aren't reviewed.
- **iOS**: appears in App Store Connect → TestFlight → Builds. Apple "Processing" takes ~10-30 min before testers can install.
- **Tag**: `git fetch --tags && git tag -l 'v*' | tail -1` should show the new tag.

## Common failure modes

- **CI gate fails (no run for SHA)** — push to main, wait for ci.yml, retry. Don't `skip_ci_gate` to dodge an unrun CI.
- **CI gate fails (CI red)** — investigate. If genuinely unrelated (e.g. a flaky acceptance test) and you've verified the build locally, retry with `skip_ci_gate=true`. The escape hatch is real but exceptional.
- **Android "version code already in use"** — auto-increment relies on the latest tag matching the latest store upload. If a run uploaded but failed to tag, set `version` explicitly to the next free build number.
- **iOS job cancelled while "Waiting for processing"** — the upload already succeeded; the chained distribute job assigns it. Don't blind-retry (re-upload collides). See memory `project_release_ios_testflight_timeout`.
- **Provisioning profile / certificate expired** — manual renewal in the Apple Developer portal + secret rotation. Out of scope; flag to the user.
- **Retry one platform** — re-run with `platforms=android` or `platforms=ios`; the tag step skips if the tag exists.

---

# Promoting to production (`release-to-production.yml`)

Promotes an already-beta-tested build to the **public** App Store (submit for review, auto-release on approval) and the Google Play **production** track (100%). It does **not** rebuild — it promotes the exact binary already on the beta channels. `workflow_dispatch` only.

## The guard (why a `-test` build can't leak to production)

Every build number is cut exactly once, and the git tag records the environment: `v<version>` = production build, `v<version>-test` = test build. iOS build numbers can't carry a `-test` suffix, so in the TestFlight list a sandbox and a prod build look identical — the tag is the only reliable signal. The workflow's guard requires **`v<version>` exists on origin AND `v<version>-test` does not**, rejects any `-test`/non-numeric/missing-tag input, and requires `confirm=PROMOTE`. It also fails fast if the per-version notes file is missing.

## Always dry-run first

`dry_run=true` exercises the **real** store APIs without publishing (iOS prepares the App Store version + attaches the build but doesn't submit; Android validates the promotion and rolls it back). It catches most store-side gaps safely.

```bash
# 1. Dry run — real APIs, publishes nothing
gh workflow run release-to-production.yml \
  -f version=2.0.4.50 -f dry_run=true -f platforms=both

# 2. Real promotion — irreversible public release. iOS first, watched.
gh workflow run release-to-production.yml \
  -f version=2.0.4.50 -f confirm=PROMOTE -f dry_run=false -f platforms=ios
# then, once iOS is in "Waiting for Review":
gh workflow run release-to-production.yml \
  -f version=2.0.4.50 -f confirm=PROMOTE -f dry_run=false -f platforms=android
```

`platforms` and a `notes_locale` input (default `en-AU`) are also available. On a real run `record-release` pushes a `production-released/v<version>` marker tag.

## Release notes ("What's New")

Per-version, keyed by build number: **`.github/release-notes/<version>.md`** (e.g. `.github/release-notes/2.0.4.50.md`). Read from `main`, not the tag — so promoting an older build while `main` is ahead can't publish notes describing features that build lacks. The same file feeds both stores (iOS App Store notes + Android production changelog). Play caps changelogs at 500 chars; App Store at 4000. **Create/update this file before promoting** — a real run fails if it's missing.

## Store-side prerequisites (verify before the FIRST run) — the dry run can't catch all of these

- **Google Play service account** needs **"Release to production, exclude devices and use Play App Signing"** — beta-upload scope is *not* enough. (In Play Console → Users & permissions; remember to click **Save Changes**.)
- **Apple age-rating questionnaire** must be complete in ASC (App Information → Age Rating). Apple's expanded questionnaire (`ageAssurance`, `messagingAndChat`, `gunsOrOtherWeapons`, `userGeneratedContent`, `healthOrWellnessTopics`, `advertising`, `lootBox`, `parentalControls`) blocks submission if unanswered. **The dry run does NOT catch this** — it uses `submit_for_review=false`, which skips the review-submission endpoint where the validation lives.
- **ASC listing** must be submission-ready: current screenshots for all required device sizes (the workflow skips screenshots, so it uses what's on the listing), agreements/tax/banking active, no half-finished version edit stuck.
- **ASC API key** role must allow submission (App Manager or Admin).

## Post-promotion checks

- **iOS**: ASC → the version shows "Waiting for Review" → "In Review" → auto-releases on approval.
- **Android**: Play Console → Production shows the release at 100% (in Google's production review first).
- **Marker**: `git fetch --tags && git tag -l 'production-released/*'`.

Full detail + the failure history: memory `project_release_to_production`.

---

## See also

- [.github/workflows/upload-build.yml](../../.github/workflows/upload-build.yml) — the beta uploader.
- [.github/workflows/distribute-testflight.yml](../../.github/workflows/distribute-testflight.yml) — the chained iOS TestFlight distribute.
- [.github/workflows/release-to-production.yml](../../.github/workflows/release-to-production.yml) — the public promotion.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — the gate.
- Memory: `project_release_pipeline` (beta pipeline history), `project_release_to_production` (public promotion + gotchas), `project_release_ios_testflight_timeout` (the TestFlight distribute decouple).
