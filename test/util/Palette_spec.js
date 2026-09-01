require("mocha");
const { expect } = require("chai");
const Palette = require("../../walta-app/app/lib/util/Palette");
const config = require("../../walta-app/app/config.json");

// bindView resolves a bound Symbol through palette[Symbol.description], so a
// Palette name with no matching config colour resolves to undefined and paints
// nothing — silently, at runtime, on whichever screen bound it.
describe("Palette", function () {
  const colors = config.global.colors;

  it("names only colours config.json defines", function () {
    const undefinedNames = Object.values(Palette)
      .map(symbol => symbol.description)
      .filter(name => !(name in colors));

    expect(undefinedNames).to.deep.equal([]);
  });
});
