const ChangeNotifier = require("../../util/ChangeNotifier");

// One dot in a photo pager's position indicator. Owns only whether it is the one
// in view; the pager tells it, the same way the tray tells its cells, so the dots
// need no per-dot wiring at the screen.
class PagerDotViewModel extends ChangeNotifier {
  constructor(index) {
    super();
    this._index = index;
    this._selected = index === 0;
  }

  get component() { return "PagerDot"; }
  get key() { return `dot:${this._index}`; }

  get selected() { return this._selected; }
  get opacity() { return this._selected ? 1.0 : 0.5; }
  get accessibilityLabel() { return `Jump To Photo ${this._index + 1}`; }

  // Notifies only on a change: paging past a dot that was already unselected
  // should not redraw it.
  setSelected(selected) {
    if (selected === this._selected) { return; }
    this._selected = selected;
    this.notifyListeners();
  }
}

module.exports = PagerDotViewModel;
