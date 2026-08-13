require("mocha");
const { expect } = require("chai");
const MenuEntryViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/MenuEntry");
const Palette = require("../../walta-app/app/lib/util/Palette");

describe("MenuEntryViewModel", function () {
  function build(over) {
    return new MenuEntryViewModel(Object.assign({
      key: "keysearch",
      icon: "/images/key-icon.png",
      title: "Key",
      description: "Questions to help identify your waterbug.",
      disabled: false,
      onSelect: () => {},
    }, over));
  }

  it("exposes the entry's display data and a stable key", function () {
    const e = build();
    expect(e.key).to.equal("keysearch");
    expect(e.icon).to.equal("/images/key-icon.png");
    expect(e.title).to.equal("Key");
    expect(e.description).to.equal("Questions to help identify your waterbug.");
  });

  it("carries the card height the view lays it out at", function () {
    expect(build({ size: "25%" }).size).to.equal("25%");
  });

  it("invokes its onSelect when enabled", function () {
    let picked = 0;
    build({ disabled: false, onSelect: () => picked++ }).select();
    expect(picked).to.equal(1);
  });

  it("swallows select when disabled", function () {
    let picked = 0;
    build({ disabled: true, onSelect: () => picked++ }).select();
    expect(picked).to.equal(0);
  });

  it("greys itself when disabled — dimmed and off-colour", function () {
    const off = build({ disabled: true });
    expect(off.disabled).to.equal(true);
    expect(off.buttonOpacity).to.equal(0.5);
    expect(off.buttonColor).to.equal(Palette.disabled);
    const on = build({ disabled: false });
    expect(on.buttonOpacity).to.equal(1);
    expect(on.buttonColor).to.equal("#cfdbf3");
  });

  it("labels itself by title, falling back to description when title is null", function () {
    expect(build({ title: "Key" }).accessibilityLabel).to.equal("Key");
    expect(build({ title: null, description: "If you can't identify the bug." }).accessibilityLabel)
      .to.equal("If you can't identify the bug.");
  });

  it("is a ChangeNotifier so the row binder can subscribe", function () {
    expect(typeof build().addListener).to.equal("function");
  });
});
