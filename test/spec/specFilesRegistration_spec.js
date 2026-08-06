require("mocha");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const specFiles = require("../../walta-app/app/spec/specFiles");

const SPEC_DIR = path.resolve(__dirname, "../../walta-app/app/spec");

// A registered spec name whose `_spec.js` file is missing makes the on-device
// mocha runner's require() throw before mocha.run — a silent hang, not a test
// failure (see spec/index.js). This Node guard catches that drift in
// milliseconds, before any device build.
function unresolvedRegistrations(names) {
  return names.filter((name) => !fs.existsSync(path.join(SPEC_DIR, `${name}_spec.js`)));
}

// The reverse drift: a `<name>_spec.js` file that EXISTS but is not registered
// in specFiles is silently skipped by the on-device runner — no failure, just
// missing coverage (this is how the SampleTaxaIcon verdict-overlay tests
// stopped running when the list was extracted out of index.js).
//
// Deliberately not loaded on-device — kept off the list on purpose:
//   Database, LeafletMap                       disabled inline in specFiles.js (see comments there)
//   CerdiApi, Key, KeyLoaderXml, QuestionLogic, Taxon   pure-logic specs run under Node in test/
//   _template                                  the new-spec scaffold, not a real spec
const INTENTIONALLY_UNREGISTERED = new Set([
  "Database", "LeafletMap",
  "CerdiApi", "Key", "KeyLoaderXml", "QuestionLogic", "Taxon",
  "_template",
]);

function deviceSpecNames(dir = SPEC_DIR, base = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return deviceSpecNames(path.join(dir, entry.name), rel);
    if (entry.name.endsWith("_spec.js")) return [rel.replace(/_spec\.js$/, "")];
    return [];
  });
}

function unregisteredSpecs(specFileNames, registeredNames, allowlist) {
  const registered = new Set(registeredNames);
  return specFileNames
    .filter((name) => !registered.has(name) && !allowlist.has(name))
    .sort();
}

describe("device spec registration", function () {
  it("flags a registered spec whose file is missing", function () {
    expect(unresolvedRegistrations(["About", "NoSuchSpec_wb220"]))
      .to.deep.equal(["NoSuchSpec_wb220"]);
  });

  it("has a file for every registered spec (no dangling entries)", function () {
    expect(unresolvedRegistrations(specFiles)).to.deep.equal([]);
  });

  it("flags a spec file that exists but is neither registered nor excluded", function () {
    expect(unregisteredSpecs(["About", "Ghost"], ["About"], new Set()))
      .to.deep.equal(["Ghost"]);
  });

  it("registers every device spec file (no silently-dropped specs)", function () {
    expect(unregisteredSpecs(deviceSpecNames(), specFiles, INTENTIONALLY_UNREGISTERED))
      .to.deep.equal([]);
  });
});
