const ChangeNotifier = require("../util/ChangeNotifier");

// State for the training TrainingSuccess modal, shown when Assess finds every creature
// correctly identified. Finish returns to the main menu; the ✕ just dismisses.
// Titanium-free.
class TrainingSuccessViewModel extends ChangeNotifier {
  constructor({ topics, correctCount = 0 }) {
    super();
    this._topics = topics;
    this._correctCount = correctCount;
  }

  get correctCount() { return this._correctCount; }

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
