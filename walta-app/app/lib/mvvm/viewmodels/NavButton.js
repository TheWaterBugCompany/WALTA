const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");

// One anchor-bar navigation button (BACK, NEXT, and the bar's icon tools). Owns
// its own styling so the shell assigns no colours: the resting and pressed
// shades, the faded look when it can't be used, and a tap a disabled button
// swallows. Titanium-free.
//
// The faded primary a disabled button wears, and the muted ink of its label.
// Not palette names — they are this control's own disabled treatment, not
// semantics any other screen shares.
const FADED_COLOR = "#5ca1b1";
const MUTED_INK = "#35869c";

class NavButtonViewModel extends ChangeNotifier {
  constructor({ label, disabled = false, onSelect }) {
    super();
    this._label = label;
    this._disabled = disabled;
    this._onSelect = onSelect;
  }

  get label() { return this._label.toUpperCase(); }

  set label(value) {
    if (this._label === value) return;
    this._label = value;
    this.notifyListeners();
  }

  // Screen readers spell out an all-caps word letter by letter, so the label the
  // button shows and the label it announces are not the same string.
  get accessibilityLabel() { return this._label; }

  get disabled() { return this._disabled; }

  set disabled(value) {
    if (this._disabled === value) return;
    this._disabled = value;
    this.notifyListeners();
  }

  get buttonColor() { return this._disabled ? FADED_COLOR : Palette.primary; }

  // A disabled button holds its resting colour under a press: there is nothing
  // to acknowledge when the tap can't do anything.
  get buttonPressedColor() { return this._disabled ? FADED_COLOR : Palette.primaryDark; }

  get labelColor() { return this._disabled ? MUTED_INK : Palette.white; }

  get iconTint() { return this._disabled ? MUTED_INK : Palette.white; }

  // The view-model owns the styling, so the button itself only needs to know
  // whether it can be touched — no saving and restoring of colours.
  get touchEnabled() { return !this._disabled; }
  get enabled() { return !this._disabled; }

  select() {
    if (!this._disabled && this._onSelect) this._onSelect();
  }
}

module.exports = NavButtonViewModel;
