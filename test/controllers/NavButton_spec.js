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
      NavButton: makeWidget({}),
      button: makeWidget({ backgroundColor: null, borderColor: null, touchEnabled: null, enabled: null }),
      label: makeWidget({ text: null, color: null, accessibilityLabel: null }),
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

  it("takes the tap on the whole control, not just the painted chrome", function () {
    let taps = 0;
    build({ onSelect: () => taps++ });

    view.NavButton.fireEvent("click");

    expect(taps).to.equal(1);
  });

  it("repaints when the view-model turns the button off", function () {
    build();

    vm.disabled = true;

    expect(view.button.backgroundColor).to.equal("#5ca1b1");
  });

  // Device specs and iOS `~id` locators read the a11y label off the label view,
  // and touchEnabled off the button — where the imperative shell used to put them.
  it("announces itself through the label, not the chrome", function () {
    build({ label: "Sync" });
    expect(view.label.accessibilityLabel).to.equal("Sync");
  });

  it("stops the button taking touches when it is disabled", function () {
    build();

    vm.disabled = true;

    expect(view.button.touchEnabled).to.equal(false);
  });

  it("stops responding to touches once disposed", function () {
    build();

    ctl.dispose();
    ctl = null;
    view.button.fireEvent("touchstart");

    expect(view.button.backgroundColor).to.equal("#26849D");
  });
});
