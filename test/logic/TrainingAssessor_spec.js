require("mocha");
const { expect } = require("chai");
const createTrainingAssessor = require("logic/TrainingAssessor");

// The tray hands the assessor its taxa items ({ taxonId, sampleTaxonId, ... }) in
// tray order; grading is strict-positional against the expected ordered taxonIds,
// and the verdict map is keyed by sampleTaxonId so the overlay is untouched.
function taxon(taxonId, sampleTaxonId) {
  return { taxonId, sampleTaxonId };
}

describe("logic/TrainingAssessor", function () {
  it("marks a taxon correct when it matches the expected taxon at its position", function () {
    const assess = createTrainingAssessor([1, 2, 3]).assess;
    const verdicts = assess([taxon(1, 101), taxon(2, 102), taxon(3, 103)]);
    expect(verdicts).to.deep.equal({ 101: "correct", 102: "correct", 103: "correct" });
  });

  it("marks a taxon incorrect when it does not match the expected taxon at its position", function () {
    const assess = createTrainingAssessor([1, 2, 3]).assess;
    const verdicts = assess([taxon(1, 101), taxon(9, 102), taxon(3, 103)]);
    expect(verdicts).to.deep.equal({ 101: "correct", 102: "incorrect", 103: "correct" });
  });

  it("grades strictly by position — a right taxon in the wrong slot is incorrect", function () {
    const assess = createTrainingAssessor([1, 2]).assess;
    const verdicts = assess([taxon(2, 101), taxon(1, 102)]);
    expect(verdicts).to.deep.equal({ 101: "incorrect", 102: "incorrect" });
  });

  it("marks an entry beyond the expected length incorrect", function () {
    const assess = createTrainingAssessor([1]).assess;
    const verdicts = assess([taxon(1, 101), taxon(2, 102)]);
    expect(verdicts).to.deep.equal({ 101: "correct", 102: "incorrect" });
  });

  it("matches taxonIds regardless of string/number type", function () {
    // The key yields string taxonIds ("181") while exercises are authored as
    // numbers (181) — they must still grade as correct.
    const assess = createTrainingAssessor([181, 179]).assess;
    const verdicts = assess([taxon("181", 101), taxon("179", 102)]);
    expect(verdicts).to.deep.equal({ 101: "correct", 102: "correct" });
  });

  it("skips taxa without a sampleTaxonId (nothing to key a verdict on)", function () {
    const assess = createTrainingAssessor([1, 2]).assess;
    const verdicts = assess([taxon(1, 101), taxon(2, null)]);
    expect(verdicts).to.deep.equal({ 101: "correct" });
  });
});
