const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");

const LAST = 2;

// State for the Academy training-session start modal. The three code boxes are
// single-digit inputs the native numeric keyboard fills: each digit typed hands
// the keyboard to the next box, so one keyboard session enters the whole code.
// Titanium-free.
class AcademyViewModel extends ChangeNotifier {
  constructor({ isValidCode } = {}) {
    super();
    this._digits = ["", "", ""];
    this._isValidCode = isValidCode || (() => false);
  }

  get digit1() { return this._digits[0]; }
  set digit1(v) { this._setDigit(0, v); }
  get digit2() { return this._digits[1]; }
  set digit2(v) { this._setDigit(1, v); }
  get digit3() { return this._digits[2]; }
  set digit3(v) { this._setDigit(2, v); }

  _setDigit(index, value) {
    // A box that already holds a digit appends the one just typed, so the last
    // character is the one the user means.
    const typed = value == null ? "" : String(value);
    const next = typed.slice(-1);
    if (this._digits[index] === next) {
      // Same digit, but the box is still showing what was typed into it —
      // notify anyway so the binding puts the single digit back.
      if (typed !== next) this.notifyListeners();
      return;
    }
    this._digits[index] = next;
    this._moveEntryOn(index, next);
    this.notifyListeners();
  }

  // Typing a digit hands the keyboard to the next box, deleting one hands it
  // back, and filling the last box ends entry so the keyboard stops covering
  // Start.
  _moveEntryOn(index, digit) {
    if (digit === "") {
      if (index > 0) this.trigger("focusDigit" + index);
    } else if (index < LAST) {
      this.trigger("focusDigit" + (index + 2));
    } else {
      this.trigger("codeComplete");
    }
  }

  get code() { return this._digits.join(""); }

  // Start is offered only once the entered code maps to a real exercise — the
  // green button is the "valid code" signal; it stays grey/disabled otherwise.
  get startEnabled() { return this._isValidCode(this.code); }
  get startColor() { return this.startEnabled ? Palette.success : Palette.disabled; }

  start() {
    if (this.startEnabled) this.trigger("start", this.code);
  }

  close() {
    this.trigger("close");
  }
}

module.exports = AcademyViewModel;
