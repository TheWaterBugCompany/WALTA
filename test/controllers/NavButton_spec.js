require("mocha");
const { expect } = require("chai");
const createNavButton = require("../../walta-app/app/lib/mvvm/controllers/NavButton");
const NavButtonViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/NavButton");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget } = require("../fixtures/fakeWidgets");

// The colours bindView resolves Palette Symbols through — the same shape
// app/config.json's global.colors has.
const PALETTE = { primary: "#26849D", primaryDark: "#1A5C6E", white: "#FFFFFF" };

describe("NavButton controller", function () {
  let view, vm, ctl;

  function build(over) {
    view = {
      button: makeWidget({ backgroundColor: null, borderColor: null, accessibilityLabel: null }),
      label: makeWidget({ text: null, color: null }),
    };
    vm = new NavButtonViewModel(Object.assign({ label: "Next", onSelect: () => {} }, over));
    ctl = createNavButton({ view, args: { rowVm: vm }, bindView: makeBinder(undefined, PALETTE) });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
  });

  it("shows the button at rest in the primary colour", function () {
    build();
    expect(view.button.backgroundColor).to.equal("#26849D");
  });

  it("darkens the button while it is held down", function () {
    build();

    view.button.fireEvent("touchstart");

    expect(view.button.backgroundColor).to.equal("#1A5C6E");
  });

  it("restores the resting colour when the touch ends", function () {
    build();

    view.button.fireEvent("touchstart");
    view.button.fireEvent("touchend");

    expect(view.button.backgroundColor).to.equal("#26849D");
  });

  it("moves the border with the background, so the whole control reads as pressed", function () {
    build();

    view.button.fireEvent("touchstart");

    expect(view.button.borderColor).to.equal("#1A5C6E");
  });

  it("captions the button from the view-model", function () {
    build({ label: "Next" });
    expect(view.label.text).to.equal("NEXT");
  });

  it("routes a tap through the view-model", function () {
    let taps = 0;
    build({ onSelect: () => taps++ });

    view.button.fireEvent("click");

    expect(taps).to.equal(1);
  });

  it("repaints when the view-model turns the button off", function () {
    build();

    vm.disabled = true;

    expect(view.button.backgroundColor).to.equal("#5ca1b1");
  });

  it("stops responding to touches once disposed", function () {
    build();

    ctl.dispose();
    ctl = null;
    view.button.fireEvent("touchstart");

    expect(view.button.backgroundColor).to.equal("#26849D");
  });
});
