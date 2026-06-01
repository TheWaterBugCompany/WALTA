# Coding Style

## JavaScript

### Async style — `async`/`await` everywhere

Default to `async`/`await` for all new code, including in `walta-app/`. Modern Titanium SDKs (13.x+) support it natively at the language level — the legacy `.then()` chains in app code reflect when they were written, not a runtime constraint.

When editing a file that uses `.then()` chains, convert the chains you touch to `async`/`await` as part of the change. **Opportunistic, not big-bang** — don't rewrite an entire file unless that's the task. The intent is to migrate the codebase incrementally as we move through it, without dedicated migration work.

### Module system — depends on the directory

| Directory | Module style | Reason |
|-----------|-------------|--------|
| `build-utils/` | ES modules (`import`/`export`) | Has `package.json` with `"type": "module"` |
| `build-tests/` | ES modules (`import`/`export`) | Has `package.json` with `"type": "module"`; mocha runs with `NODE_OPTIONS=--experimental-vm-modules` |
| `Gruntfile.js` | CommonJS (`module.exports`, `require`) | Grunt 1.6+ supports `Gruntfile.mjs` for ESM — tracked in WB-55. Until that lands, use dynamic `import()` to consume ES modules. |
| `walta-app/` | CommonJS (`require`, `module.exports`) | **Alloy's build pipeline is CommonJS-only.** Switching to ESM would require rewriting Alloy itself. Keep `require()` and `module.exports` in app code. |

The Alloy constraint only applies to module syntax. `async`/`await` is just JavaScript syntax and works fine inside a CommonJS file.

## Defensive code

**Trust inputs from systems you control.** When parsing values from our own backend, our own config, or our own storage, default to the simplest correct parse — `parseInt`, `JSON.parse`, plain destructuring — and let downstream fallback paths catch malformed values. Strict parsers (round-trip-string equality, regex pre-validation, exhaustive type guards) belong at *untrusted* boundaries — direct user input, third-party APIs we don't own, files chosen from the filesystem. If our own backend sends garbage, that's a server bug; the fix is on the server, not a stricter parser on the client.

**Extract helpers for intent, not size.** A well-named three-line helper that says *what* the reader needs to know (`lowercaseHeaders(obj)`, `isRetryable(err)`) often reads more clearly than the same logic inlined — the name itself is the abstraction. The trap is helpers whose name just paraphrases the operation (`parseIntegerString` around `parseInt(x, 10)`): those add a hop without adding meaning. The test isn't line count, it's whether the name tells the reader something they couldn't see from the call site. If yes, extract. If it just renames the obvious, inline.

**Question cargo-culted defensiveness.** Habits like `parseInt(x, 10)`, `(opts || {}).foo`, `JSON.parse(x ?? "{}")` were each fixes for a real bug at some point, but the original bug may be long-dead in modern JS. Before keeping such a bit, ask "what fails if I remove this?" — if the answer is "nothing", remove it.

**Express option defaults at the function signature.** For factory/options-object functions, destructure with defaults in the parameter list rather than running an `opts.X != null ? opts.X : default` ladder in the body. Defaults live where the reader looks first, and the body uses bare names.

```js
// Prefer
function createPacer({ headroom = 10, fallbackDelayMs = 2500 } = {}) { /* ... */ }

// Over
function createPacer(opts = {}) {
    const headroom = opts.headroom != null ? opts.headroom : 10;
    const fallbackDelayMs = opts.fallbackDelayMs != null ? opts.fallbackDelayMs : 2500;
    // ...
}
```

**Let it error on unexpected input.** JavaScript is happy to throw on `null.foo` or `Object.keys(undefined)` — that's a feature. A `TypeError` surfaces a caller bug at the seam where it happens; an `if (!x) return;` swallows the same bug and turns it into a silent no-op that fails far away from the cause. Validate at *real* boundaries (Ti.Network responses, user input, files from disk); inside our own modules, trust the contract and let unexpected `null`/`undefined` throw. If the loud crash is the wrong answer for a particular caller, fix the *caller* to not pass garbage — don't paper over it in the callee.

## Comments

A short comment that pins down a non-obvious **why** is welcome — a hidden constraint, a workaround for a specific bug, an invariant that wouldn't make sense from the surrounding code alone. That's what comments are for.

**But long, flowery comments are a refactor signal.** If you find yourself writing paragraphs to explain what a function does or why a block is structured the way it is, the code itself is probably too complex. Reach for clearer names, smaller functions, better structure first — the comment usually disappears on its own. The same goes for runs of short comments stitched together to narrate every few lines: that's prose papering over structure that should speak for itself.

A few rules of thumb regardless of length:

1. Don't paraphrase what the code already says.
2. Don't narrate the change you're making — that context belongs in the commit message. Commits don't rot; source comments do.
3. Don't recap the bug you just fixed for the same reason.
4. Keep comments self-contained — no references to Trello cards (`WB-XXX`), PR numbers, GitHub issues, or any other external identifier. External coordinates rot, churn, or disappear; a comment that requires a reader to leave the codebase to make sense of it has already failed. Put that context in the commit message and PR description.

### Long comments belong in `docs/`

If a comment is more than a couple of lines explaining *why this pattern exists* or *how this module fits into the broader design*, it belongs in a `docs/` page — not in the source file. Leave a one-line pointer:

```js
// see docs/patterns/viewmodels.md "Semantic palette colours"
```

Reasons: code-level comments rot when the design moves; long blocks bury the actual code; the same explanation usually applies to multiple files, and `docs/` lets it live in one place. Inline comments are still right for the *local* why — a hidden constraint, a workaround for a specific bug, a non-obvious invariant.

When adding to `docs/`, follow the [write-docs](../.claude/skills/write-docs/SKILL.md) skill.
