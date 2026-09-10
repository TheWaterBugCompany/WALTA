require("mocha");
const { expect } = require("chai");
const Belts = require("../../walta-app/app/lib/logic/Belts");

describe("Belts", function () {

  it("awards a yellow belt with a bare tip at the first level", function () {
    expect(Belts.at(1)).to.deep.equal({ color: "#FEFF46", tipColor: "#FFFFFF" });
  });

  it("keeps the yellow belt while the tip advances through yellow and orange", function () {
    expect(Belts.at(2)).to.deep.equal({ color: "#FEFF46", tipColor: "#FEFF46" });
    expect(Belts.at(3)).to.deep.equal({ color: "#FEFF46", tipColor: "#F4C437" });
  });

  it("moves the belt itself to orange once the yellow tips are done", function () {
    expect(Belts.at(4)).to.deep.equal({ color: "#F4C437", tipColor: "#FEFF46" });
    expect(Belts.at(5)).to.deep.equal({ color: "#F4C437", tipColor: "#F4C437" });
    expect(Belts.at(6)).to.deep.equal({ color: "#F4C437", tipColor: "#9ED67B" });
  });

  it("moves the belt to green for the last two levels", function () {
    expect(Belts.at(7)).to.deep.equal({ color: "#9ED67B", tipColor: "#F4C437" });
    expect(Belts.at(8)).to.deep.equal({ color: "#9ED67B", tipColor: "#9ED67B" });
  });

  it("has no belt below the first level", function () {
    expect(Belts.at(0)).to.equal(null);
    expect(Belts.at(null)).to.equal(null);
  });

  it("stays at the highest belt rather than inventing one past the end", function () {
    expect(Belts.at(9)).to.deep.equal(Belts.at(Belts.HIGHEST));
  });

  it("counts eight belts", function () {
    expect(Belts.HIGHEST).to.equal(8);
  });

  it("names a belt whose tip matches it by its colour alone", function () {
    expect(Belts.describe(Belts.at(2))).to.equal("Yellow belt");
    expect(Belts.describe(Belts.at(5))).to.equal("Orange belt");
    expect(Belts.describe(Belts.at(8))).to.equal("Green belt");
  });

  it("names the tip when it differs from the belt", function () {
    expect(Belts.describe(Belts.at(3))).to.equal("Yellow belt with an orange tip");
    expect(Belts.describe(Belts.at(7))).to.equal("Green belt with an orange tip");
  });

  it("calls a bare tip white, as it is drawn", function () {
    expect(Belts.describe(Belts.at(1))).to.equal("Yellow belt with a white tip");
  });

  it("has nothing to say about no belt", function () {
    expect(Belts.describe(null)).to.equal(null);
  });

});
