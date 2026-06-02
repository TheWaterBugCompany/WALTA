---
name: tidy
description: Tidy code — small structure-improving changes (extract for intent, rename, inline, hoist, simplify) that don't alter behaviour. Forces the discipline of naming intent rather than commenting it, and of proposing rather than silently restructuring. Load during the refactor phase of a TDD cycle, for a standalone cleanup pass, or whenever reading code in flight surfaces a clearer structure. Skip for behavioural changes — use tdd instead.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Tidying (WALTA)

Small structure-improving changes that don't change behaviour: extracting a helper, hoisting a responsibility, renaming, inlining, simplifying. Kent Beck's *Tidy First?* concept — the cousin of the REFACTOR step in TDD, but not gated on a recent test cycle. The point is to leave the code more readable than you found it, in small reversible moves.

## When to use

- Refactor phase of a TDD cycle (tests are green, now improve structure).
- Standalone cleanup pass over a module you're about to extend.
- **While reading code for any other task** — see the proactive trigger below.

Skip this skill (use [tdd](../tdd/SKILL.md)) when the change observably alters behaviour. A pure rename, an extraction, an inline — all are tidies. The moment the change adds, removes, or alters a behaviour, switch to tdd.

## Proactive trigger — name the block

While reading code in service of any task, actively ask of each 3–8 line block: **"if I extracted this as a helper, what would I call it, and is that name clearer than the inline form?"** If a clean name presents itself, that's the signal — propose the extraction. Don't wait to be prompted. Lead with the recommendation, not with hedging ("you could but I'd leave it").

The marginal case still counts. A 6-line block with a clear name is worth extracting; the readability gain lands at the call site even if there's only one caller and even if the inline form is workable.

## Extract for intent — the name test

The test for whether an extraction earns its keep is whether the *name* tells the reader something the inline form doesn't.

```js
// Before — 6 lines that you have to parse in your head
for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    h._entries.set(name, value);
}

// After — the name carries intent at the call site
for (const line of raw.split(/\r?\n/)) {
    const entry = parseHeaderLine(line);
    if (entry) h._entries.set(entry.name.toLowerCase(), entry.value);
}
```

`parseHeaderLine` does real work as a name: it tells the reader "one line in, one header or nothing out" without them tracing slices. The inline form was *workable*; the named form is *clearer*. That's the bar.

The opposite trap is helpers whose name just paraphrases the operation — `parseIntegerString` wrapping `parseInt(x, 10)`, `getName` wrapping `obj.name`. Those add a hop without adding meaning. The discriminator is whether the name *abstracts* or merely *renames*.

A related move: when extracting, give the helper the *narrow* responsibility and let the class keep its storage convention. In the example above, `parseHeaderLine` returns a faithful `{ name, value }`; the lowercasing belongs to `HttpHeaders.parse` because `get()` also lowercases on lookup. The class owns the canonicalization; the helper just parses.

## Not valid reasons to refuse an extraction

These reflexes are all speculative and should not fire when weighing a tidy:

- **"Only one caller today."** YAGNI applies to *generalizing* a helper for hypothetical callers, not to *naming* an operation that's already there. The reader benefit lands at one call site as much as at many.
- **"Extra function-call hop."** Sub-nanosecond. Not measurable outside a tight inner loop, and tidy is rarely operating inside one.
- **"Extra object allocation per iteration."** Same — allocations are essentially free at the app layer. WALTA's real perf concerns are network latency, UI render cost, TableView reload, and sync IO, all orders of magnitude above anything function-shape-related.

If you find yourself reaching for any of these as a reason not to extract, stop. The actual question is whether the name carries intent. Perf objections are only legitimate in tight inner loops (per-frame render, image pixel work, thousands-of-records sync), and even there the first intervention is "do less work", not "inline the helper".

## Comments are the fallback, not the default

When intent isn't obvious from the inline expression, prefer extracting a named helper over writing a comment to explain it. Two reasons:

1. Comments rot; function names travel with the call site. A stale name shows up as a refactor smell at every call; a stale comment is silent misdirection.
2. The name is *checked* by every caller — every reader who reaches the call site has to find it plausible — whereas a comment is read at most once.

Reserve comments for the non-obvious *why* — hidden constraints, workarounds, invariants — per the Comments section of [docs/coding-style.md](../../../docs/coding-style.md).

## Scope: in-scope tidies vs drive-by tidies

Tidies in code you're *already touching for the current task*: include them. That's not a side quest, it's doing the task well. The reviewer sees them in the diff alongside the primary change.

Tidies in *adjacent* untouched code: open a separate branch. The CLAUDE.md "one PR = one responsibility" rule still applies — drive-by tidies on unrelated files turn a focused PR into a sprawling one. Splitting up front costs minutes; splitting after the fact costs an hour of rebasing and re-running CI.

Borderline case: if the tidy is *needed* to make the task's change clean (e.g. extracting a helper so the new code can call it), it's in scope. If it would be a nice cleanup but the task could land without it, it's a drive-by — separate branch.

## Propose, don't silently restructure

For broad sweeps — touching many files, renaming an interface, reshaping a module — flag the intent to the user before doing the work, even if every individual move is a tidy. Code happens fast in these sessions; the human reviewer is the project's refactor-detector, and a surfaced proposal gives them a checkpoint to decide refactor-now vs. carry-on (CLAUDE.md "Methodology" section).

A single small extraction in code you're already in: just do it, and call it out in the commit message. A 10-file rename of `Foo` to `Bar`: propose first.

## See also

- [tdd](../tdd/SKILL.md) — for behavioural changes (red/green/refactor); the refactor step is where tidy applies.
- [docs/coding-style.md](../../../docs/coding-style.md) — defensive-code policy, extract-for-intent rule, comments policy.
- [open-pr](../open-pr/SKILL.md) — one-PR-one-responsibility detail, and how drive-by tidies split off.
