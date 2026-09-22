require("mocha");
const { expect } = require("chai");
const BeltViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Belt");

describe("BeltViewModel", function () {

  it("wears the belt's own colour along its length", function () {
    const vm = new BeltViewModel({ color: "#FFFFFF", tipColor: "#FEFF46" });
    expect(vm.color).to.equal("#FFFFFF");
  });

  it("wears the tip colour at the tip", function () {
    const vm = new BeltViewModel({ color: "#FFFFFF", tipColor: "#FEFF46" });
    expect(vm.tipVisible).to.be.true;
    expect(vm.tipColor).to.equal("#FEFF46");
  });

  it("leaves an untipped belt one unbroken colour", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null });
    expect(vm.tipVisible).to.be.false;
  });

  it("says which belt it is, for anyone who cannot see it", function () {
    const vm = new BeltViewModel({ color: "#FFFFFF", tipColor: "#FEFF46" });
    expect(vm.label).to.equal("White belt with a yellow tip");
  });

  // A screen showing one belt gives it a holder to fill; a screen showing a
  // grid of them sizes each one instead, so they can sit side by side.
  it("fills its holder unless the screen says otherwise", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null });
    expect(vm.width).to.equal("100%");
    expect(vm.height).to.equal("100%");
  });

  it("takes the size the screen gives it", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null }, { width: "30%", height: "32dp" });
    expect(vm.width).to.equal("30%");
    expect(vm.height).to.equal("32dp");
  });

  // A belt on its own has nothing to be spaced from; belts in a grid do, and
  // the grid cannot space them itself.
  it("sits flush unless the screen asks for room around it", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null });
    expect(vm.left).to.equal("0dp");
    expect(vm.top).to.equal("0dp");
  });

  it("takes the room the screen asks for", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null }, { left: "2%", top: "3%" });
    expect(vm.left).to.equal("2%");
    expect(vm.top).to.equal("3%");
  });

  it("is keyed by the level it stands for, so a grid of them reconciles", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null }, { level: 2 });
    expect(vm.key).to.equal("belt:2");
  });

  it("is the Belt component, so a screen can mount it by name", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null });
    expect(vm.component).to.equal("Belt");
  });

});
