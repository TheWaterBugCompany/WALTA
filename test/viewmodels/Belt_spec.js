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

  it("is the Belt component, so a screen can mount it by name", function () {
    const vm = new BeltViewModel({ color: "#FEFF46", tipColor: null });
    expect(vm.component).to.equal("Belt");
  });

});
