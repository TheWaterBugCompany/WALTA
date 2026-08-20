const createTrainingAssessor = require("logic/TrainingAssessor");

// Training-session service — the training-mode counterpart to Survey. Owns the
// active session's SampleTray + assessor. Titanium-free.
module.exports = function createTraining({ repo, exercises }) {
  let tray = null;
  let assessor = null;

  return {
    startTraining(code) {
      const order = exercises.loadExercise(code);
      if (!order) return false;
      // Re-entering the same code retains the in-progress tray where the user left
      // off; a different code starts a fresh session (wiping the old one).
      tray = repo.currentSessionCode() === code ? repo.loadTray() : repo.startSession(code);
      assessor = createTrainingAssessor(order);
      return true;
    },

    // The active session's tray + assessor — the training screens thread these into
    // their args (the session lives here, its owner, not in Navigation).
    currentTray() { return tray; },
    currentAssessor() { return assessor; },

    // Whether a code maps to a real exercise — the Academy gates Start on this.
    isValidCode(code) {
      return exercises.loadExercise(code) !== null;
    },

    // Add an identified taxon. With no position it appends. Given a position, it
    // replaces the taxon already in that slot, so re-identifying a wrong pick
    // preserves positional grading.
    addTaxon(taxonId, position) {
      if (position == null) {
        return repo.addTaxon(tray, taxonId, tray.length);
      }
      const old = tray.taxa().find((t) => t.position === position);
      if (old) repo.removeTaxon(tray, old);
      return repo.addTaxon(tray, taxonId, position);
    },
  };
};
