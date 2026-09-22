const ChangeNotifier = require("../../util/ChangeNotifier");
const Belts = require("../../logic/Belts");

// One belt, drawn wherever a screen needs to show which one is meant: earned on
// the training success screen, held or offered on the Academy screen. Owns only
// how a belt looks; the screen above it owns which belt that is.
class BeltViewModel extends ChangeNotifier {
  constructor(belt) {
    super();
    this._belt = belt;
  }

  get component() { return "Belt"; }

  get color() { return this._belt && this._belt.color; }

  get tipVisible() { return Boolean(this._belt && this._belt.tipColor); }

  get tipColor() { return this._belt && this._belt.tipColor; }

  get label() { return Belts.describe(this._belt); }
}

module.exports = BeltViewModel;
