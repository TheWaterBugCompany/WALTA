const ChangeNotifier = require("../util/ChangeNotifier");

// State for the Academy training-session start modal. The three code boxes are
// display-only: tapping one (startEditing) opens a 0-9 picker, and tapping a
// digit (pickDigit) fills that box and closes the picker — so no system
// keyboard is ever summoned. Titanium-free.
class AcademyViewModel extends ChangeNotifier {
  constructor() {
    super();
    this._digits = ["", "", ""];
    this._editing = null;
  }

  get digit1() { return this._digits[0]; }
  get digit2() { return this._digits[1]; }
  get digit3() { return this._digits[2]; }

  get code() { return this._digits.join(""); }

  get pickerVisible() { return this._editing !== null; }

  get startEnabled() { return this._digits.every((d) => d !== ""); }

  startEditing(index) {
    this._editing = index;
    this.notifyListeners();
  }

  pickDigit(digit) {
    if (this._editing === null) return;
    this._digits[this._editing] = String(digit);
    this._editing = null;
    this.notifyListeners();
  }

  cancelPicker() {
    if (this._editing === null) return;
    this._editing = null;
    this.notifyListeners();
  }

  start() {
    if (this.startEnabled) this.trigger("start", this.code);
  }

  close() {
    this.trigger("close");
  }
}

module.exports = AcademyViewModel;
