const createTrainingAssessor = require("logic/TrainingAssessor");

// Training-session service — the training-mode counterpart to Survey. Owns the
// active session's SampleTray + assessor (per-session state, so a factory with a
// closure rather than Survey's stateless module object). The screens that open the
// training tray look the session up here (currentTray/currentAssessor) and thread
// it on in their args; training mode itself is a threaded parameter, not state held
// by Navigation. Titanium-free.
module.exports = function createTraining({ repo, exercises }) {
  let tray = null;
  let assessor = null;

  return {
    startTraining(code) {
      const order = exercises.loadExercise(code);
      if (!order) return false;
      tray = repo.startSession(code);
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

    // Add an identified taxon. With no position it appends (position = current
    // length — the store takes position as given). Given a position, it drops the
    // taxon already in that slot and puts the new one there, so re-identifying a
    // wrong pick preserves positional grading. The position rides in from the tap
    // through the key identification rather than being held as session state.
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
