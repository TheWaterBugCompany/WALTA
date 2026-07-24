const ChangeNotifier = require("../util/ChangeNotifier");

const DIGIT = /^[0-9]$/;

// State for the Academy training-session start modal: three single-digit boxes
// that assemble into a session code. Titanium-free; the boxes bind two-way to
// digit1/2/3 and Start binds its enabled state to startEnabled.
class AcademyViewModel extends ChangeNotifier {
  constructor() {
    super();
    this._digits = ["", "", ""];
  }

  _setDigit(i, value) {
    const next = value == null ? "" : String(value);
    if (this._digits[i] === next) return;
    this._digits[i] = next;
    this.notifyListeners();
  }

  get digit1() { return this._digits[0]; }
  set digit1(v) { this._setDigit(0, v); }
  get digit2() { return this._digits[1]; }
  set digit2(v) { this._setDigit(1, v); }
  get digit3() { return this._digits[2]; }
  set digit3(v) { this._setDigit(2, v); }

  get code() { return this._digits.join(""); }

  get startEnabled() { return this._digits.every((d) => DIGIT.test(d)); }

  start() {
    if (this.startEnabled) this.trigger("start", this.code);
  }

  close() {
    this.trigger("close");
  }
}

module.exports = AcademyViewModel;
