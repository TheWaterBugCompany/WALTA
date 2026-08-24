const ChangeNotifier = require("../../util/ChangeNotifier");

const PLUS_ICON = "/images/plus-icon.png";

// The "add to sample" tray cell — the polymorphic sibling of SampleTaxaIcon. Two
// kinds: "plus" (the first empty slot, showing the plus icon) and "addBehind"
// (empty slots past it — invisible but still tappable to add). Both fire the
// add-to-sample intent; the cell owns it, so the tray needs no per-cell wiring.
class SampleTrayPlusViewModel extends ChangeNotifier {
  constructor(tray, collectionIndex, position) {
    super();
    this._tray = tray;
    this._collectionIndex = collectionIndex;
    this._position = position;
    this._kind = null;
  }

  get component() { return "SampleTrayPlus"; }
  get key() { return `${this._position}:${this.component}`; }
  get kind() { return this._kind; }
  get widthCss() { return `${this._tray.cellWidth}dp`; }

  // Only the plus cell shows the icon; add-behind cells are invisible but tappable.
  get plusVisible() { return this._kind === "plus"; }
  get plusImage() { return this._kind === "plus" ? PLUS_ICON : undefined; }
  get accessibilityLabel() { return this._kind === "plus" ? "Add Sample" : ""; }

  update(kind) {
    if (kind === this._kind) return;
    this._kind = kind;
    this.notifyListeners();
  }

  // Report the tap to the tray by collection index; the tray decides what a
  // plus/add-behind cell tap means, not this purely-presentational cell.
  tap() { this._tray.selectCell(this._collectionIndex); }
}

module.exports = SampleTrayPlusViewModel;
