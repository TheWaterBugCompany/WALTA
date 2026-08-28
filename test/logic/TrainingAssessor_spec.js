require("mocha");
const { expect } = require("chai");
const createTrainingAssessor = require("logic/TrainingAssessor");

// The tray hands the assessor one entry per numbered cell, indexed by tray
// position ({ taxonId, sampleTaxonId } or nothing for an unidentified cell);
// the verdicts come back in the same positional order.
function taxon(taxonId, sampleTaxonId) {
  return { taxonId, sampleTaxonId };
}

describe("logic/TrainingAssessor", function () {
  it("reports how many cells the exercise expects", function () {
    expect(createTrainingAssessor([1, 2, 3]).expectedCount).to.equal(3);
  });

  it("marks a cell correct when it matches the expected taxon at its position", function () {
    const assess = createTrainingAssessor([1, 2, 3]).assess;
    expect(assess([taxon(1, 101), taxon(2, 102), taxon(3, 103)]))
      .to.deep.equal(["correct", "correct", "correct"]);
  });

  it("marks a cell incorrect when it does not match the expected taxon at its position", function () {
    const assess = createTrainingAssessor([1, 2, 3]).assess;
    expect(assess([taxon(1, 101), taxon(9, 102), taxon(3, 103)]))
      .to.deep.equal(["correct", "incorrect", "correct"]);
  });

  it("grades strictly by position — a right taxon in the wrong slot is incorrect", function () {
    const assess = createTrainingAssessor([1, 2]).assess;
    expect(assess([taxon(2, 101), taxon(1, 102)])).to.deep.equal(["incorrect", "incorrect"]);
  });

  it("marks an unidentified cell incorrect", function () {
    const assess = createTrainingAssessor([1, 2]).assess;
    expect(assess([taxon(1, 101)])).to.deep.equal(["correct", "incorrect"]);
  });

  it("grades every expected cell even when nothing has been identified", function () {
    expect(createTrainingAssessor([1, 2]).assess([])).to.deep.equal(["incorrect", "incorrect"]);
  });

  it("matches taxonIds regardless of string/number type", function () {
    // The key yields string taxonIds ("181") while exercises are authored as
    // numbers (181) — they must still grade as correct.
    const assess = createTrainingAssessor([181, 179]).assess;
    expect(assess([taxon("181", 101), taxon("179", 102)])).to.deep.equal(["correct", "correct"]);
  });

  // Grading says a cell is wrong; the comparison screen has to say what the right
  // answer was, so the expected order is readable by position and not just
  // consumed internally.
  describe("the expected taxon at a position", function () {
    it("names the taxon the exercise expected there", function () {
      expect(createTrainingAssessor([181, 179]).expectedAt(1)).to.equal(179);
    });

    it("has nothing to name beyond the exercise", function () {
      expect(createTrainingAssessor([181]).expectedAt(5)).to.be.undefined;
    });
  });
});
