const ChangeNotifier = require("../../util/ChangeNotifier");
const Belts = require("../../logic/Belts");
const BeltViewModel = require("./Belt");

// State for the training TrainingSuccess modal, shown when Assess finds every creature
// correctly identified. Finish returns to the main menu; the ✕ just dismisses.
// Titanium-free.
class TrainingSuccessViewModel extends ChangeNotifier {
  constructor({ topics, correctCount = 0, belt = null }) {
    super();
    this._topics = topics;
    this._correctCount = correctCount;
    this._belt = belt;
    // Always built, even for a session that earned nothing: the belt is a fixed
    // child of the screen, so it is mounted either way and simply hidden.
    this._beltVm = new BeltViewModel(belt);
  }

  get beltVm() { return this._beltVm; }

  get correctCount() { return this._correctCount; }

  // A session that carries no belt still congratulates the trainee on the
  // creatures they got right, so the belt half of the screen simply goes.
  get beltVisible() { return Boolean(this._belt); }

  get beltMessage() {
    return this._belt ? `You've earned your ${Belts.nameOf(this._belt)} belt:` : null;
  }

  get message() {
    const creatures = this._correctCount === 1 ? "creature" : "creatures";
    return `Well done! You've identified the ${this._correctCount} correct ${creatures}!`;
  }

  finish() {
    this.trigger("close");
    this._topics.fireTopicEvent(this._topics.HOME);
  }

  close() {
    this.trigger("close");
  }
}

module.exports = TrainingSuccessViewModel;
