// Placeholder training assessor. Real grading — comparing the taxa the user added
// against the set expected for the site — lands later behind this same interface:
//   assess(taxa) -> { [sampleTaxonId]: "correct" | "incorrect" }
// Until then it marks every taxon correct so the feedback screen is wired end to
// end without inventing wrong answers. The tray injects it and calls assess() when
// the user taps Assess; tests inject a fake assessor with known verdicts.
module.exports = function createTrainingAssessor() {
  return {
    assess(taxa) {
      const verdicts = {};
      taxa.forEach(function (taxon) {
        if (taxon && taxon.sampleTaxonId != null) {
          verdicts[taxon.sampleTaxonId] = "correct";
        }
      });
      return verdicts;
    },
  };
};
