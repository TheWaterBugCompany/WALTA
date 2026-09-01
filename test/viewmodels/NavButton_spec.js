require("mocha");
const { expect } = require("chai");
const NavButtonViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/NavButton");
const Palette = require("../../walta-app/app/lib/util/Palette");

// The faded primary a disabled anchor-bar button wears, and the muted ink of its
// label — kept here so the spec fails if the view-model quietly restyles.
const FADED = "#5ca1b1";
const MUTED = "#35869c";

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

  it("shows its label in capitals", function () {
    expect(build({ label: "Next" }).label).to.equal("NEXT");
  });

  // Screen readers spell out an all-caps word letter by letter.
  it("keeps the plain words for a screen reader", function () {
    expect(build({ label: "Next" }).accessibilityLabel).to.equal("Next");
  });

  it("fades when it is disabled", function () {
    expect(build({ disabled: true }).buttonColor).to.equal(FADED);
  });

  // Nothing to acknowledge when the press can't do anything.
  it("does not darken under a press when it is disabled", function () {
    expect(build({ disabled: true }).buttonPressedColor).to.equal(FADED);
  });

  it("dims its label when it is disabled", function () {
    expect(build({ disabled: true }).labelColor).to.equal(MUTED);
  });

  it("shows a white label when it is enabled", function () {
    expect(build().labelColor).to.equal(Palette.white);
  });

  it("takes a caption after it is built, so a screen can name its own button", function () {
    const vm = build({ label: "Next" });

    vm.label = "Assess";

    expect(vm.label).to.equal("ASSESS");
  });

  it("tints its icon to match its label", function () {
    expect(build({ disabled: true }).iconTint).to.equal(MUTED);
  });

  // The view-model owns the colours now, so the button only needs to be told
  // whether it can be touched — no save-and-restore of styling.
  it("refuses touches when it is disabled", function () {
    expect(build({ disabled: true }).touchEnabled).to.equal(false);
  });

  it("acts on a tap", function () {
    let taps = 0;
    build({ onSelect: () => taps++ }).select();
    expect(taps).to.equal(1);
  });

  it("swallows a tap when it is disabled", function () {
    let taps = 0;
    build({ disabled: true, onSelect: () => taps++ }).select();
    expect(taps).to.equal(0);
  });
});
