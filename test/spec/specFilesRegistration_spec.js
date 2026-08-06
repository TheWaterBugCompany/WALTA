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

describe("device spec registration", function () {
  it("flags a registered spec whose file is missing", function () {
    expect(unresolvedRegistrations(["About", "NoSuchSpec_wb220"]))
      .to.deep.equal(["NoSuchSpec_wb220"]);
  });

  it("has a file for every registered spec (no dangling entries)", function () {
    expect(unresolvedRegistrations(specFiles)).to.deep.equal([]);
  });
});
