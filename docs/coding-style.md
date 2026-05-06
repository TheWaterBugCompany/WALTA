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
