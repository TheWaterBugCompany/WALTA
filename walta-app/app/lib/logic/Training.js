const createTrainingAssessor = require("logic/TrainingAssessor");

// Training-session service — the training-mode counterpart to Survey. Owns the
// active session's SampleTray + assessor (per-session state, so a factory with a
// closure rather than Survey's stateless module object), and announces it on
// TRAINING_STARTED the way Survey announces SURVEY_STARTED. Navigation seeds the
// tray/assessor it threads into every screen's args from that event. Titanium-free.
module.exports = function createTraining({ topics, repo, exercises }) {
  let tray = null;
  let assessor = null;

  return {
    startTraining(code) {
      const order = exercises.loadExercise(code);
      if (!order) return false;
      tray = repo.startSession(code);
      assessor = createTrainingAssessor(order);
      topics.fireTopicEvent(topics.TRAINING_STARTED, { tray, assessor, training: true });
      return true;
    },

    // Whether a code maps to a real exercise — the Academy gates Start on this.
    isValidCode(code) {
      return exercises.loadExercise(code) !== null;
    },

    isActive() {
      return tray !== null;
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
