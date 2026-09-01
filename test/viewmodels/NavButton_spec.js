require("mocha");
const { expect } = require("chai");
const NavButtonViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/NavButton");
const Palette = require("../../walta-app/app/lib/util/Palette");

describe("NavButtonViewModel", function () {
  function build(over) {
    return new NavButtonViewModel(Object.assign({
      label: "Next",
      onSelect: () => {},
    }, over));
  }

  it("rests in the primary colour", function () {
    expect(build().buttonColor).to.equal(Palette.primary);
  });

  it("darkens while held down, so a touch is acknowledged before the screen changes", function () {
    expect(build().buttonPressedColor).to.equal(Palette.primaryDark);
  });
});
