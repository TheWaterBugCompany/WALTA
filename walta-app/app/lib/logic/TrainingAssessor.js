// Grades a training attempt against the exercise's expected taxa, by position.
// One verdict per numbered cell, in cell order — an unidentified cell is
// incorrect, so the tray can cross it.
//   createTrainingAssessor(expectedOrder).assess(cells)
//     -> ["correct" | "incorrect", ...]   (expectedOrder.length entries)
module.exports = function createTrainingAssessor(expectedOrder = []) {
  return {
    expectedCount: expectedOrder.length,

    // Grading says a cell is wrong; the comparison screen has to say what was
    // right, so the expected order is readable by position rather than only
    // consumed by assess().
    expectedAt(position) { return expectedOrder[position]; },

    assess(cells) {
      return expectedOrder.map(function (expectedTaxonId, i) {
        const cell = cells[i];
        // The key yields string taxonIds ("181"); exercises are authored as
        // numbers (181). Compare as strings so the two sources line up.
        return cell && String(cell.taxonId) === String(expectedTaxonId)
          ? "correct"
          : "incorrect";
      });
    },
  };
};
