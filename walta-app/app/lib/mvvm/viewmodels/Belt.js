const ChangeNotifier = require("../../util/ChangeNotifier");
const Belts = require("../../logic/Belts");

// One belt, drawn wherever a screen needs to show which one is meant: earned on
// the training success screen, held or offered on the Academy screen. Owns only
// how a belt looks; the screen above it owns which belt that is.
class BeltViewModel extends ChangeNotifier {
  // A screen showing one belt gives it a holder to fill, and says nothing about
  // its size; a screen showing a grid of them sizes each one instead, so they
  // can sit side by side.
  constructor(belt, { level = null, width = "100%", height = "100%",
                      left = "0dp", top = "0dp" } = {}) {
    super();
    this._belt = belt;
    this._level = level;
    this._width = width;
    this._height = height;
    this._left = left;
    this._top = top;
  }

  get component() { return "Belt"; }

  get key() { return `belt:${this._level}`; }

  get width() { return this._width; }

  get height() { return this._height; }

  // A belt on its own has nothing to be spaced from; belts in a grid do, and a
  // wrapping row cannot space its children itself.
  get left() { return this._left; }

  get top() { return this._top; }

  get color() { return this._belt && this._belt.color; }

  get tipVisible() { return Boolean(this._belt && this._belt.tipColor); }

  get tipColor() { return this._belt && this._belt.tipColor; }

  get label() { return Belts.describe(this._belt); }
}

module.exports = BeltViewModel;
