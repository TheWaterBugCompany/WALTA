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

    isActive() {
      return tray !== null;
    },

    // Append an identified taxon to the session tray. Position is the caller's
    // concern (the store takes it as given), so training appends at the end.
    addTaxon(taxonId) {
      return repo.addTaxon(tray, taxonId, tray.length);
    },
  };
};
