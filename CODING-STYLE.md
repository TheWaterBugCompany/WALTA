# Coding Style

## JavaScript

New code in `build-utils/` and `build-tests/` should follow modern JavaScript practices:

- **Modules:** Use `import`/`export` (ES modules) instead of `require`/`module.exports`
- **Async:** Use `async`/`await` instead of `.then()`/`.catch()` chains

Both directories have a `package.json` with `"type": "module"` which enables ES module
syntax for all `.js` files within them. The mocha commands for these tests use
`NODE_OPTIONS=--experimental-vm-modules` to support ESM.

Legacy code in `Gruntfile.js` and `walta-app/` uses CommonJS (`require`) and `.then()`
chains — leave those as-is unless explicitly migrating them.
