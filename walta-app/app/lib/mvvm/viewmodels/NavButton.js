const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");

// One anchor-bar navigation button (BACK, NEXT, and the bar's icon tools).
// Titanium-free.
class NavButtonViewModel extends ChangeNotifier {
  constructor({ label, onSelect }) {
    super();
    this._label = label;
    this._onSelect = onSelect;
  }

  get buttonColor() { return Palette.primary; }
  get buttonPressedColor() { return Palette.primaryDark; }
}

module.exports = NavButtonViewModel;
