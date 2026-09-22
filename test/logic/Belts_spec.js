require("mocha");
const { expect } = require("chai");
const Belts = require("../../walta-app/app/lib/logic/Belts");

describe("Belts", function () {

  it("awards a white belt with a yellow tip at the first level", function () {
    expect(Belts.at(1)).to.deep.equal({ color: "#FFFFFF", tipColor: "#FEFF46" });
  });

  it("gives a belt its own colour outright once its tip is earned", function () {
    expect(Belts.at(2)).to.deep.equal({ color: "#FEFF46", tipColor: null });
    expect(Belts.at(4)).to.deep.equal({ color: "#F4C437", tipColor: null });
  });

  it("tips a belt in the next colour up before the belt itself moves", function () {
    expect(Belts.at(3)).to.deep.equal({ color: "#FEFF46", tipColor: "#F4C437" });
    expect(Belts.at(5)).to.deep.equal({ color: "#F4C437", tipColor: "#9ED67B" });
  });

  it("runs on through green and blue to black", function () {
    expect(Belts.at(6)).to.deep.equal({ color: "#9ED67B", tipColor: null });
    expect(Belts.at(7)).to.deep.equal({ color: "#9ED67B", tipColor: "#6FA8DC" });
    expect(Belts.at(8)).to.deep.equal({ color: "#6FA8DC", tipColor: null });
    expect(Belts.at(9)).to.deep.equal({ color: "#6FA8DC", tipColor: "#000000" });
    expect(Belts.at(10)).to.deep.equal({ color: "#000000", tipColor: null });
  });

  // The white belt is what you wear for never having trained, so it is the
  // absence of a belt rather than an entry in the ladder.
  it("has no belt below the first level", function () {
    expect(Belts.at(0)).to.equal(null);
    expect(Belts.at(null)).to.equal(null);
  });

  it("stays at the highest belt rather than inventing one past the end", function () {
    expect(Belts.at(11)).to.deep.equal(Belts.at(Belts.HIGHEST));
  });

  it("counts ten belts", function () {
    expect(Belts.HIGHEST).to.equal(10);
  });

  it("names an untipped belt by its colour alone", function () {
    expect(Belts.describe(Belts.at(2))).to.equal("Yellow belt");
    expect(Belts.describe(Belts.at(8))).to.equal("Blue belt");
    expect(Belts.describe(Belts.at(10))).to.equal("Black belt");
  });

  it("names the tip when it has one", function () {
    expect(Belts.describe(Belts.at(1))).to.equal("White belt with a yellow tip");
    expect(Belts.describe(Belts.at(3))).to.equal("Yellow belt with an orange tip");
    expect(Belts.describe(Belts.at(9))).to.equal("Blue belt with a black tip");
  });

  it("has nothing to say about no belt", function () {
    expect(Belts.describe(null)).to.equal(null);
  });

  // The screens that congratulate you on a belt, or offer you the next one,
  // put its name inside a sentence of their own: "your white with yellow tip
  // belt", "a yellow belt".
  it("names a belt for use inside a sentence", function () {
    expect(Belts.nameOf(Belts.at(1))).to.equal("white with yellow tip");
    expect(Belts.nameOf(Belts.at(2))).to.equal("yellow");
    expect(Belts.nameOf(Belts.at(9))).to.equal("blue with black tip");
  });

  it("has no name for no belt", function () {
    expect(Belts.nameOf(null)).to.equal(null);
  });

});
