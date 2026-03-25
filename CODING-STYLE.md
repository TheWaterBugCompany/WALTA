# Coding Style

## JavaScript

New code in `build-utils/` and `build-tests/` should follow modern JavaScript practices:

- **Modules:** Use `import`/`export` (ES modules) instead of `require`/`module.exports`
- **Async:** Use `async`/`await` instead of `.then()`/`.catch()` chains

`build-utils/` and `build-tests/` have a `package.json` with `"type": "module"` which
enables ES module syntax for all `.js` files within them. The mocha commands for these
tests use `NODE_OPTIONS=--experimental-vm-modules` to support ESM.

`Gruntfile.js` is CommonJS (`module.exports`, `require`) for Grunt compatibility — new
code added to it should use `async`/`await` where possible, but `import`/`export` is not
available there. Use dynamic `import()` to consume ES modules from the Gruntfile.

Legacy code in `walta-app/` uses CommonJS and `.then()` chains — leave those as-is.
