---
name: write-docs
description: Guidance for adding to or updating the project's `docs/` folder. Load when the user asks to document something, or when you've just rediscovered a non-obvious pattern worth saving for next session.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Writing project documentation (WALTA)

The `docs/` folder is the long-lived knowledge layer. CLAUDE.md links to it
so that next session — yours, a teammate's, an AI agent's — can find what
this session learned. This skill captures the rules for adding to it.

## When to write something down

Ask: **"would the next session save time if it could find this?"**

Yes → write it down. Common triggers:

- A non-obvious pattern you had to reverse-engineer from existing code.
- A gotcha that just cost you 20 minutes (a flag, an undocumented platform
  difference, a build step that wasn't where you expected).
- A convention that isn't enforced by tooling and isn't obvious from one
  file alone (cross-file conventions, naming patterns, layout rules).
- A workaround whose *why* is non-obvious (e.g. "we wrap in a ScrollView on
  iOS because Ti's setSelection isn't exposed on TextArea in our SDK").

No → keep it out of `docs/`. Examples:

- One-off bug fixes — the commit message is the right home.
- Anything derivable by reading the code or running `git log`.
- Conversation-only context ("we tried X, didn't work, picked Y").
- A description of what the code *does* — names and tests express that.

The rule of thumb: docs cover **why** and **how-to-use**, not **what**.

## Where to put it

- **`docs/patterns/<name>.md`** — one file per pattern, module, or concept.
  Examples: `viewmodels.md`, `toolbar-buttons.md`, `CerdiApi.md`. Link new
  files from `docs/patterns/README.md` (the index).
- **`docs/<topic>.md`** at the top level — for cross-cutting topics
  (`installation.md`, `testing.md`, `coding-style.md`, `pull-requests.md`,
  `device-specs.md`). Update the relevant section instead of starting a
  new file when one already covers the topic.
- **Source-file comment** — only the *local* why (a hidden constraint, a
  workaround for a specific bug, a non-obvious invariant). See
  [docs/coding-style.md](../../docs/coding-style.md) for the comment policy.

The seam to remember: **architectural narrative goes in `docs/`, not in
source headers.** If a comment is more than a couple of lines explaining
*why this pattern exists* or *how this module fits the design*, it belongs
in a doc. Leave a one-line pointer in the source:

```js
// see docs/patterns/viewmodels.md "Semantic palette colours"
```

Reasons: code-level comments rot when the design moves; long blocks bury
the actual code; the same explanation usually applies to multiple files,
and `docs/` lets it live in one place.

## How to write it

**Short and specific beats long and generic.** A one-liner with a code
example is almost always the right length. If you're writing more than a
screen, you're probably trying to capture too much in one page — split.

Structure each doc page:

1. **One-sentence purpose** at the top. The reader should know in 10s
   whether this page is what they need.
2. **The smallest concrete example.** A 5-line snippet, an actual file
   path, a real command. Abstract prose can't pin a pattern down.
3. **The why.** One paragraph max. If it needs more, you're documenting
   architecture, not a pattern — move to `docs/architecture-vision.md` or
   split.
4. **Cross-links.** Link to neighbouring docs and to real source files
   that demonstrate the pattern.

Voice: present-tense, second-person, declarative. "Pass `--simulator` to
target the emulator." not "You may wish to consider passing the
`--simulator` flag, which has the effect of targeting the emulator."

## Linking back from CLAUDE.md

CLAUDE.md is loaded into every conversation, so its job is to be a thin
index of pointers, not to carry the prose. When you add a new doc page:

- If it's a *new top-level topic* — add a one-line link to the docs list
  in CLAUDE.md (`## Architecture > Documentation maintenance > docs list`).
- If it's a *new pattern* under `docs/patterns/` — link only from the
  patterns README, not CLAUDE.md. The patterns index is the right entry
  point.
- If it expands an existing doc — no CLAUDE.md change needed.

Keep CLAUDE.md links to one line each: file path + ~10-word description
of what's inside.

## What NOT to create

- **No README files in random subdirectories.** The pattern README and the
  top-level README are the only ones. Don't add a `walta-app/README.md`.
- **No process logs, no decision diaries, no roadmaps in `docs/`** — those
  belong in Trello / commit messages / PR descriptions where they have a
  natural decay path.
- **No Trello card numbers (`WB-N`) or other private identifiers.** The repo
  is public; card refs are opaque to outside readers and rot silently.
  Describe the change or constraint itself; leave tracking to commits/PRs.
- **No long-form architecture pieces in source files.** Source comments
  are for local why only.

## See also

- [docs/coding-style.md](../../docs/coding-style.md) — comment policy: when a
  source comment is justified vs. when the same content belongs in `docs/`.
- [CLAUDE.md](../../CLAUDE.md) — the docs index and "Documentation
  maintenance" pointer.
- [docs/patterns/README.md](../../docs/patterns/README.md) — the patterns
  index (what's already documented).
