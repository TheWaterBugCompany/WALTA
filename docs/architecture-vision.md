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

## The presentation DSL

MVVM removes `Ti.*` from the ViewModel, but the *screen controller* — the layer wiring a ViewModel to its widgets — can still leak Titanium (a `setData` call, an `Alloy.createController`). The direction is to make that layer a **framework-agnostic DSL**: a screen controller declares *what* binds to *what*, and nothing about *how* Titanium realises it.

Two rules carry the DSL:

- **Declare, don't call.** A screen controller passes data to `bindView` — a bindings object, a `collection(getter, componentName)` marker — and never invokes a Titanium method. `bindView` translates the declarations into widget writes, event wiring, and a keyed collection diff.
- **The binder is injected, not imported.** The `View` seam hands each controller a `bindView` pre-bound (via `makeBinder`) with its Titanium-side dependencies — the component factory for lists, the colour palette for Symbol getters. The controller writes zero wiring; see [screen-controllers.md](patterns/screen-controllers.md).

`bindView` itself *is* Titanium-coupled — it calls `setData`, reads widget properties, drives the Alloy component factory. That is deliberate: **`bindView` is one implementation of the binder DSL, and a port reimplements it.** What ports unchanged is everything above it — the ViewModels and the screen controllers' declarations.

The collection **reconciler** inside `bindView` (the keyed create/retain/dispose diff) is the clearest case: on a Flutter port you *delete* it, because Flutter's Element reconciler already does exactly that keyed diff. A seam whose implementation the target framework provides for free is a seam drawn in the right place — and its throwaway-ness is the proof. Likewise the injected component factory dissolves on Flutter, where you simply construct the widget.

**The portability test for any screen controller:** *could you transcribe this file to a Flutter `build()` method without knowing it was ever Titanium?* If a `Ti.*` / `Alloy.*` / `setData` reference makes that impossible, the glue is in the wrong layer — push it down into `bindView`.

**Growing `bindView` is the default; an escape hatch is the exception you justify.** When a screen has Titanium the DSL can't yet express — a genuine Ti *input* (a scroll offset, a measured viewport), an imperative *output effect* (an animated scroll), a single fixed nested child or a mixed-component list — the first move is to **add the general binding to `bindView`**, not to route it around the DSL through a residual Alloy-shell method or an injected imperative effect. `bindView` grew exactly this way: it started as outbound property binding, then gained `input` (inbound: a widget event feeds a VM setter), `measure` (inbound: a laid-out property feeds a VM setter), `command` (a VM event reflectively calls a widget method), `component` (one fixed nested child), and the polymorphic `collection` (each item names its own component). Those absorbed what a shell hand-off (`attachViewModel`) would otherwise have held, so the SampleTray shell keeps **no** view-model. `bindView` stays Titanium-agnostic — it reads/writes properties and calls named methods, never knowing what `contentOffset` or `scrollTo` mean; unit conversion lives in the ViewModel behind injected converters.

**A framework quirk hides inside the binding, not beside it.** The distinction that matters is *interface* vs *implementation*, not "portable feature" vs "Titanium hack." Measuring a laid-out property is a portable idea — Flutter's `LayoutBuilder` and CSS's `ResizeObserver` are the same shape — so `measure(vmMethod, "size")` earns its place in the DSL. The Titanium-specific wrinkles behind it (postlayout fires several times as a frame settles, and can fire early with a zero-sized or throwing read — both *measured* on device) are absorbed *inside* `measure`'s implementation: it re-reads on each layout so the last settled reading wins, and waits out an unsettled one. A Flutter port swaps that implementation for `LayoutBuilder` and keeps the same `measure` interface and the same plain `vm.setViewport`. So the rule isn't "keep quirks in the shell" — it's **grow the portable binding, and encapsulate the framework quirk in its implementation** where a port replaces it wholesale. A residual is allowed to stay in the Alloy shell **only** when it is genuinely *impossible* or *makes no sense* in `bindView` (an in-flight view tree, a not-yet-ported sub-screen), and each surviving line should be justified, not assumed. A novel shell↔VM coupling is a signal to extend the DSL before it reaches `main`, not to ship it and unwind later.

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
