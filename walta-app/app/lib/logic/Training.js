const createTrainingAssessor = require("logic/TrainingAssessor");

// Training-session service — the training-mode counterpart to Survey. Owns the
// active session's SampleTray + assessor. Titanium-free.
module.exports = function createTraining({ repo, exercises, keyTrail, topics }) {
  let tray = null;
  let assessor = null;

  // The session belongs to whoever was signed in when it started, and there is
  // one per device — so signing out has to take it with them. Left behind, the
  // next trainee starting the same course is handed that tray, and for a course
  // already passed that is every taxon, correct and in position.
  topics.subscribe(topics.LOGGEDOUT, endSession);

  function endSession() {
    repo.clear();
    tray = null;
    assessor = null;
  }

  // False for a code that maps to no exercise; otherwise the session is live and
  // its tray and assessor are the ones the training screens read.
  function openSession(code, resumable) {
    const order = exercises.loadExercise(code);
    if (!order) return false;
    const resuming = resumable && repo.currentSessionCode() === code;
    tray = resuming ? repo.loadTray() : repo.startSession(code);
    assessor = createTrainingAssessor(order);
    return true;
  }

  return {
    // Re-entering the same code retains the in-progress tray where the user left
    // off; a different code starts a fresh session (wiping the old one).
    startTraining(code) { return openSession(code, true); },

    // Going back over a course already passed: the tray it was passed with is
    // exactly what must not come back, so this wipes the session whether or not
    // the code is the one in progress.
    restartTraining(code) { return openSession(code, false); },

    // The code of the session in progress — what earned belt is looked up by.
    currentSessionCode() { return repo.currentSessionCode(); },

    // The session is over — passed, or abandoned because its owner signed out.
    // Nothing is left for startTraining to resume, so the course begins afresh
    // next time rather than handing back the tray it was finished with.
    endSession,

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
    //
    // The route walked to reach it is stored alongside: a taxon can sit at the
    // end of more than one route through the key, so which question the reader
    // got wrong is only answerable from the one they took. In training the key
    // is the only way to an identification, so there is always one to read.
    addTaxon(taxonId, position) {
      const route = keyTrail.route();
      if (position == null) {
        return repo.addTaxon(tray, taxonId, tray.length, route);
      }
      const old = tray.taxa().find((t) => t.position === position);
      if (old) repo.removeTaxon(tray, old);
      return repo.addTaxon(tray, taxonId, position, route);
    },
  };
};
