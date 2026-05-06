# Architecture Vision

This document captures the direction we are moving towards, not a commitment or a plan. It is here to guide decisions as we touch code, and to avoid relitigating the same questions repeatedly. Assumptions may turn out to be wrong — update rather than ignore when that happens.

## Principles

- **Minimise framework coupling.** Business logic should not know about Titanium, or any future UI framework. The goal is that logic modules are plain JS, runnable in Node.js without mocks.
- **UI layers are thin.** Controllers and views handle binding, lifecycle, and events only. They do not contain logic.
- **Testability is a design signal.** If something is hard to test, the design is wrong — not the test.
- **Migrate by attrition.** We are not doing a big-bang rewrite. As we touch screens and modules, we leave them better than we found them.

## Target Pattern: MVVM

The current Alloy MVC pattern couples logic tightly to `Ti.*` APIs, making it hard to test and hard to migrate. The target pattern is MVVM:

- **View** — Alloy XML + minimal controller code. Handles rendering and user input only.
- **ViewModel** — Plain JS module. Contains all screen logic and state. No `Ti.*` dependencies. Returns plain data structures.
- **Model** — Existing logic modules in `lib/logic/` and `lib/util/`, progressively cleaned of `Ti.*` leakage.

When building a new screen, establish the ViewModel first and test it with Node.js unit tests before wiring up the View. When touching an existing screen, extract logic into a ViewModel as part of the refactor step.

The first screen implemented this way serves as the reference pattern for the rest of the codebase.

## Framework Direction

The current Titanium/Alloy framework has served the project but its layout model requires frequent postlayout workarounds and the ecosystem is in decline. Flutter is the most promising candidate for an eventual UI layer replacement:

- Layout model is deterministic — the postlayout hack problem goes away
- Native API coverage for camera and filesystem (the main native touchpoints in WALTA) is mature
- If business logic is in plain JS/ViewModel modules, migration is a UI layer concern only

This is not a decision to migrate now. It is a reason to keep the UI layer thin so that migration remains an option. A spike on one screen in Flutter would validate the assumption before any larger commitment.

## Incremental Path

1. **Prove the MVVM pattern** on one new or significantly changed screen
2. **Document the pattern** in CLAUDE.md once validated, so it is applied consistently
3. **Progressively extract** logic from existing controllers into ViewModels as screens are touched — guided by the methodology's refactor step, not as a separate initiative
4. **Spike Flutter** on one complex screen once enough ViewModels exist to test the migration story cleanly
5. **Reassess** based on what the spike reveals

## What This Is Not

This is not a refactoring project. It is a direction that shapes decisions made during normal feature work. The methodology's small-increment approach applies here too — no step should require setting aside feature work for a dedicated refactor sprint.
