// Grades a training attempt against the exercise's expected taxa, in order.
// The tray hands assess() its taxa items ({ taxonId, sampleTaxonId, ... }) in
// tray order; grading is strict-positional (position i is correct iff the taxon
// there is expectedOrder[i]), and the verdict map is keyed by sampleTaxonId so
// the tick/cross overlay reads it unchanged.
//   createTrainingAssessor(expectedOrder).assess(taxa)
//     -> { [sampleTaxonId]: "correct" | "incorrect" }
module.exports = function createTrainingAssessor(expectedOrder = []) {
  return {
    assess(taxa) {
      const verdicts = {};
      taxa.forEach(function (taxon, i) {
        if (taxon && taxon.sampleTaxonId != null) {
          // The key yields string taxonIds ("181"); exercises are authored as
          // numbers (181). Compare as strings so the two sources line up.
          verdicts[taxon.sampleTaxonId] =
            String(taxon.taxonId) === String(expectedOrder[i]) ? "correct" : "incorrect";
        }
      });
      return verdicts;
    },
  };
};
