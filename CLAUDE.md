# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WALTA (Waterbug App) is a cross-platform mobile app for iOS and Android that enables dichotomous key-based insect identification for water quality monitoring. It is built on the Titanium/Alloy MVC framework.

## Coding Style

Before writing or editing code, consult [docs/coding-style.md](docs/coding-style.md) — module system per directory, async/await direction, the defensive-code policy (trust inputs from systems we control; extract helpers for intent, not size; question cargo-culted defensiveness; let it error on unexpected input), and the comment policy (default to none; short *why* comments only — single line; never narrate the change, recap the bug, replay hypotheses, or include external refs like `WB-XXX` — that belongs in the commit message; architectural narrative belongs in `docs/`, not source headers).

## Methodology

This project follows test-driven development (Kent Beck style): each behavioural change starts with a small failing test, then the minimal code to make it pass, then a tidy-up pass. Work in small increments and prefer small commits focused on a single change. The point is to drive design with tests and refactor continuously so tech debt doesn't accumulate — coverage is a byproduct of good tests, not the target.

Before any development work, load the [tdd](.claude/skills/tdd/SKILL.md) skill — every behavioural change starts with a failing test, including small ones. Skip only for non-behavioural edits (typos, formatting, comment-only changes).

For structural improvements without a behaviour change — the refactor phase of TDD, a standalone cleanup pass, or extractions surfaced while reading code in service of another task — load the [tidy](.claude/skills/tidy/SKILL.md) skill. It encodes the project's stance on extracting for intent (including at the margin), the speculative objections to ignore (caller count, hop cost, allocations), and the scope discipline for drive-by tidies.

When iterating on `Ti.*` / Alloy code (controllers, view specs, cucumber scenarios), load the [fast-iteration](.claude/skills/fast-iteration/SKILL.md) skill — narrow with `--grep` and use `--liveview --reuse-server` so each iteration is seconds, not minutes. Skip this skill when the change is pure JS — `npx grunt unit-test-node` is faster.

When a code smell surfaces mid-session — tangled deps, hidden state, a function doing two things, a workaround stacking on a workaround — pause and flag it for review rather than silently restructuring or pressing on. Code happens fast in these sessions; the human reviewer is the project's refactor-detector, and surfacing smells gives them a checkpoint to decide refactor-now vs. carry-on.

## Workflow

### Starting a Trello task

When the user asks to start work on a Trello card (e.g. "let's start work on `WB-N`"):

1. Look up the card details from Trello to understand the requirements.
2. Create a new branch named `task/wb-<N>-<short-slug>`.
3. Once the first commits are ready, create a **draft PR** — load the [open-pr](.claude/skills/open-pr/SKILL.md) skill for the procedure (template reference: [docs/pull-requests.md](docs/pull-requests.md)).

### Iterating on a draft PR

Once the draft PR exists, commit and push directly to the task branch as work progresses — review happens on the PR's Files Changed view, not by showing diffs in chat. This applies to `task/wb-<N>-...` branches only; direct commits to `main`, force pushes, and history rewrites still need explicit approval.

### One PR = one responsibility

If unrelated work surfaces while you're in the middle of a task — a build fix, a small refactor, an improvement to a different module, a new methodology rule — open a separate task branch and PR for it, merge that independently, and rebase the in-progress branch on top. Don't bundle side quests into the main PR. They turn a focused, mergeable change into a sprawling pile that's hard to review, hard to revert, and where one flaky test in the side quest delays the main work. Splitting after the fact is significant overhead (rebasing, multiple PR descriptions, CI re-runs); splitting up front is ~free.

## Commands

### Setup

```bash
brew install node@24
brew install ios-deploy
brew install libimobiledevice
npm install
npx appium driver install xcuitest
npx appium driver install uiautomator2
```

The following environment variables must be set before building (add to your shell profile):

```bash
export GOOGLE_MAPS_API_KEY="<android maps api key>"   # Required for all builds — injected into tiapp.xml from tiapp.xml.template
export KEYSTORE="<path to keystore>"                  # Required for Android release builds
export KEYSTORE_PASSWORD="<keystore password>"
export KEYSTORE_SUBKEY="<keystore alias>"
```

> `tiapp.xml` is not committed — it is generated at build time by `injectSecrets()` in the Gruntfile from `tiapp.xml.template`.

### Build

```bash
npx grunt --platform=android debug
npx grunt --platform=ios debug
npx grunt --platform=android clean release
npx grunt --platform=ios clean release
npx grunt --platform=android preview   # Live development with fast iteration

# Add --simulator to target the emulator/iOS simulator instead of a device.
# Add --reset to wipe Ti.App.Properties / sqlite before launch (handy when a
# stale auth token from a prior session is poisoning login).
npx grunt --platform=ios --simulator --reset debug
```

### Test

```bash
npx grunt unit-test-node                       # Node-only unit tests, fastest feedback
npx grunt build-test                           # Build-utils / hooks / launcher unit tests
npx grunt --platform=ios unit-test             # iOS device / simulator unit specs
npx grunt --platform=android unit-test         # Android device / emulator unit specs
npx grunt --platform=ios acceptance-test       # iOS cucumber acceptance scenarios
npx grunt --platform=android acceptance-test   # Android cucumber acceptance scenarios
```

**Always invoke tests via the grunt wrappers** — never `npx mocha` directly. The wrappers set the right `NODE_PATH`, `NODE_OPTIONS`, and test-file globs; raw mocha runs can hang silently (no test output) when those aren't configured.

**Device and acceptance specs are runnable in-session** via the [fast-iteration](.claude/skills/fast-iteration/SKILL.md) skill (LiveView warm loop ~20–30 s) — they are not human-only or CI-only. Treat a device spec as a normal part of the TDD loop; don't push logic into Node-only shapes just to avoid a device build.

See the [tdd](.claude/skills/tdd/SKILL.md) and [fast-iteration](.claude/skills/fast-iteration/SKILL.md) skills.

### Device Logging

```bash
adb logcat -s "TiAPI:*"   # Android
```

## Architecture

### Framework

- **Titanium SDK** with **Alloy MVC** — views are XML (`.xml`), styles are TSS (`.tss`), controllers are JS
- Single codebase compiles to both iOS and Android; platform-specific code lives in `lib/android/` and `lib/ios/`

### Key Directories

- `walta-app/app/controllers/` — 40+ UI controllers
- `walta-app/app/lib/logic/` — Business logic: `CerdiApi.js` (API client), `KeyLoader*.js` (taxonomy loading), `SampleUploader/Downloader.js` (sync)
- `walta-app/app/lib/util/` — Shared utilities (Logger, PhotoUtils, etc.)
- `walta-app/app/assets/` — Static assets and taxonomy data
- `walta-taxonomy/walta/` — Compiled taxonomy files (`key.json`, `key.ink.json`)
- `test/` — Node.js unit test specs (`*_spec.js`)
- `features/` — Cucumber BDD acceptance tests
- `end-to-end-testing/` — Appium integration tests

### Project docs

Technical docs live in `docs/` (only `README.md`, `CLAUDE.md`, and `CONTRIBUTORS.md` stay at the repo root). See the [write-docs](.claude/skills/write-docs/SKILL.md) skill for adding to or updating them.

**Docs are public** (the repo is open-source) — never cite Trello card numbers (`WB-N`) or other private/internal identifiers in `docs/`, `README.md`, or `CLAUDE.md`. They're opaque to outside readers and rot silently. Describe the change or constraint itself; card/issue tracking belongs in commit messages and PR descriptions (the same rule the [coding-style](docs/coding-style.md) comment policy applies to source).

- [docs/installation.md](docs/installation.md) — setup guide: prerequisites, Titanium SDK, signing, env vars
- [docs/coding-style.md](docs/coding-style.md) — JS conventions and comment policy
- [docs/architecture-vision.md](docs/architecture-vision.md) — long-term architectural direction
- [docs/testing.md](docs/testing.md) — five test layers and what to use when. Note the deliberate split between the two top layers: `features/` (Cucumber) is business-readable BDD tied to product requirements; `end-to-end-testing/` (Mocha+Appium) is for extensive, mechanism-heavy integration (e.g. sync interrupt/resume) that would clutter a business scenario. It runs in CI on both platforms — don't push low-level integration mechanics into `features/`.
- [docs/device-specs.md](docs/device-specs.md) — device-spec idioms and gotchas
- [docs/pull-requests.md](docs/pull-requests.md) — PR template
- [docs/security.md](docs/security.md) — Dependabot triage policy: why scope ≠ runtime risk for Titanium, what's runtime-bundled, and how to handle alerts
- [docs/patterns/](docs/patterns/) — pattern/module summaries; see [docs/patterns/README.md](docs/patterns/README.md) for the index

### Configuration & Environment

**API endpoint switching:** Pass `--app-config=mock|production|development` to grunt to switch API base URLs. The mock config points to a local stub server for offline development.

**Signed Android release builds** require three environment variables set in `Gruntfile.js` (lines 13–21): keystore path, keystore password, and developer profile. These are not in version control — set them locally.

### Data Flow

The app loads taxonomy data from `taxonomy/walta/key.json` via `KeyLoaderJson.js` at startup ([walta-app/app/controllers/index-app.js](walta-app/app/controllers/index-app.js)). `CerdiApi.js` handles all remote API communication for sample upload/download and user authentication. `SampleUploader` and `SampleDownloader` orchestrate bi-directional sync, fired by `SampleSync.js` on a timer.
