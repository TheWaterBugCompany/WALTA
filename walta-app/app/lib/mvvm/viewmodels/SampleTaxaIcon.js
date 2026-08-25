const ChangeNotifier = require("../../util/ChangeNotifier");

// A taxon (or blank) tray cell. Carries the silhouette + abundance for a taxon,
// nothing for a blank, and its own edit intent. Its polymorphic sibling is
// SampleTrayPlus (the add affordance); the cell container swaps between the two by
// kind, so this VM never knows about the plus. Mirrors SampleHistoryRow: the cell
// owns its tap intent, so the tray needs no per-cell wiring.
class SampleTaxaIconViewModel extends ChangeNotifier {
  constructor(tray, collectionIndex, position) {
    super();
    this._tray = tray;
    this._collectionIndex = collectionIndex;
    this._position = position;
    this._kind = null;
    this._data = null;
  }

  // The component the polymorphic collection builds for this slot, and the key it
  // diffs on — position:component, so a slot swapped to the add affordance (a
  // different component) is recreated rather than wrongly retained.
  get component() { return "SampleTaxaIcon"; }
  get key() { return `${this._position}:${this.component}`; }
  get kind() { return this._kind; }
  get widthCss() { return `${this._tray.cellWidth}dp`; }

  get iconVisible() { return this._kind === "taxon"; }

  get numberVisible() { return this._kind === "number"; }
  get numberText() { return `${this._collectionIndex + 1}`; }
  get numberFont() { return { fontSize: `${this._tray.cellWidth * 0.9}dp`, fontWeight: "bold" }; }
  get image() { return this._data ? this._data.silhouette : null; }
  get abundanceText() { return this._data ? this._data.abundance : ""; }
  get abundanceVisible() { return this._kind === "taxon" && this._data.abundance != null; }
  get sampleTaxonId() { return this._data ? this._data.sampleTaxonId : null; }
  get taxonId() { return this._data ? this._data.taxonId : null; }

  // The training tick/cross overlay. Optional, only displyed if the source has a `verdictFor` method.
  get verdict() {
    return typeof this._tray.verdictFor === "function" ? this._tray.verdictFor(this._collectionIndex) : null;
  }
  get verdictImage() {
    if (this.verdict === "correct") return "/images/tick-icon.png";
    if (this.verdict === "incorrect") return "/images/cross-icon.png";
    return null;
  }
  get verdictVisible() { return this.verdictImage !== null; }
  // A square badge scaled to the cell so it keeps the tick/cross aspect; the tss
  // insets it into the cell's lower-left.
  get verdictSizeCss() { return `${this._tray.cellWidth * 0.45}dp`; }

  get accessibilityLabel() {
    if (this._kind === "taxon") {
      return `Taxon ${this._data.taxonId}, ${this._data.name}, abundance ${this._data.abundance}`;
    }
    if (this._kind === "number") return `Cell ${this.numberText}`;
    return "";
  }

  // Re-derive this slot's kind/content in place; notify iff something changed
  // (positional reuse for a taxon that stays a taxon with the same content).
  update(kind, data) {
    if (kind === "taxon") {
      if (this._kind === "taxon" && this._dataEquals(data)) return;
      this._kind = "taxon";
      this._data = data;
      this.notifyListeners();
      return;
    }
    if (kind === this._kind) return;
    this._kind = kind; // "blank" or "number"
    this._data = null;
    this.notifyListeners();
  }

  tap() { this._tray.selectCell(this._collectionIndex); }

  _dataEquals(o) {
    const a = this._data;
    return a && o
      && a.silhouette === o.silhouette
      && a.abundance === o.abundance
      && a.taxonId === o.taxonId
      && a.sampleTaxonId === o.sampleTaxonId
      && a.name === o.name;
  }
}

module.exports = SampleTaxaIconViewModel;
