---
name: release
description: Cut a WALTA release — triggers the `release.yml` GitHub Action which builds, signs, uploads to Play Store internal track / TestFlight, and tags the SHA. Load when the user asks to release, push a beta, cut a build for testers, or bump the version.
user-invocable: true
allowed-tools:
  - Bash
  - Read
---

# Cutting a release (WALTA)

## The discipline: use the workflow, not local builds

Releases run from [.github/workflows/release.yml](../../.github/workflows/release.yml) — never build-and-upload locally. The workflow owns:

- version computation (auto-increment from the latest `v*` tag),
- signing-secret handling (Android keystore, iOS p12 + provisioning profile),
- store upload (Google Play internal track, Apple TestFlight),
- annotated tag creation (`v<version>`).

Local builds for testing on a device or simulator are fine. *Release builds* — anything going to a store or a tester — go through the workflow.

## Trigger the workflow

```bash
# Default: production environment, both platforms, auto-incremented version
gh workflow run release.yml

# Explicit (all fields optional except via -f for non-defaults)
gh workflow run release.yml \
  -f environment=production \
  -f platforms=both \
  -f version=               # leave empty to auto-increment
```

Then poll the run:

```bash
gh run list --workflow=release.yml --limit=3
gh run watch <run-id>        # streams the job log
```

## Inputs

| Input | Default | Notes |
|---|---|---|
| `environment` | `production` | `production` = real CERDI API + clean `v<version>` tag. `test` = sandbox CERDI + `v<version>-test` tag, version suffixed `-test` on Android (iOS can't carry the suffix — Apple rejects non-integer `CFBundleVersion`). |
| `platforms` | `both` | `android`, `ios`, or `both`. Use single-platform when one job failed and the other succeeded — the tag-create step skips if the tag already exists, so a retry won't conflict. |
| `version` | empty | Empty = auto-increment the build number from the latest `v*` tag (production *and* test share one build-number sequence so they never collide). Set explicitly only when you need a specific version (e.g. major bump). Format: `major.minor.patch.build` (e.g. `2.0.5.1`). |
| `skip_ci_gate` | `false` | Skips the requirement that the latest `ci.yml` run on the release SHA succeeded. Use **only** when CI is red for a known unrelated reason (e.g. an intermittent flake) and you've manually verified the build. |

## What the workflow does

1. **CI gate** — refuses to release a SHA whose latest `ci.yml` run didn't succeed. Bypass with `skip_ci_gate=true` only after manual verification.
2. **Compute version** — auto-increments from `git tag -l 'v*' --sort=-v:refname | head -1`, or uses the explicit `version` input. Fallback base when no tags exist: `2.0.4.0`.
3. **Android build** — bumps `tiapp.xml.template`, writes app-config (prod or test sandbox), builds signed release with the project keystore, uploads the `.aab` to Google Play **internal track** (status `completed`).
4. **iOS build** — same prep, builds signed `.ipa`, uploads to **TestFlight** via `altool`. (Note: the upload step now fails if `altool` prints `ERROR:` lines even when it exits 0 — historically masked CFBundleVersion rejections.)
5. **Tag release** — pushes an annotated `v<version>` (or `v<version>-test`) tag. Skips silently if the tag already exists on the remote, supporting single-platform retries at the same version.

Concurrency is `group: release, cancel-in-progress: false` — only one release runs at a time, and triggering a second queues it rather than killing the first.

## Post-release checks

- **Android**: appears in Google Play Console → Internal testing track within ~10 min. Testers update via the Play Store on their device.
- **iOS**: appears in App Store Connect → TestFlight → Builds. Apple's "Processing" step takes ~10-30 min before testers can install.
- **Tag**: `git fetch --tags && git tag -l 'v*' | tail -1` should show the new tag.

## Common failure modes

- **CI gate fails (no run found for SHA)** — push to main and wait for ci.yml to finish, then retry. Don't `skip_ci_gate` to dodge an unrun CI.
- **CI gate fails (CI red)** — investigate. If the failure is genuinely unrelated to the release (e.g. a flaky acceptance test) and you've verified the build path locally, retry with `skip_ci_gate=true`. The escape hatch is real but should be the exception.
- **Android upload "version code already in use"** — auto-increment relies on the latest tag matching the latest store upload. If a previous run uploaded but failed to tag (rare), set `version` explicitly to the next free build number.
- **iOS upload succeeded but no TestFlight build** — altool's silent-error mode (now caught by the workflow). Re-run with the same version and check the new altool output.
- **Provisioning profile / certificate expired** — manual renewal in Apple Developer portal + secret rotation. Out of scope for this skill; flag to the user.
- **Want to retry one platform** — re-run with `platforms=android` or `platforms=ios`. The tag-create step skips silently if the tag already exists, so no version conflict.

## See also

- [.github/workflows/release.yml](../../.github/workflows/release.yml) — source of truth.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — the gate.
- Memory: `project_release_pipeline` — historical context (pipeline became live as of v2.0.4.20, 2026-04-16).
