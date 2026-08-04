const ChangeNotifier = require("../util/ChangeNotifier");
const SampleTaxaIconViewModel = require("./SampleTaxaIcon");
const SampleTrayPlusViewModel = require("./SampleTrayPlus");

const ADD_KINDS = new Set(["plus", "addBehind"]);

function componentForKind(kind) {
  return ADD_KINDS.has(kind) ? "SampleTrayPlus" : "SampleTaxaIcon";
}

function makeSlot(kind, tray, collectionIndex, position) {
  return componentForKind(kind) === "SampleTrayPlus"
    ? new SampleTrayPlusViewModel(tray, collectionIndex, position)
    : new SampleTaxaIconViewModel(tray, collectionIndex, position);
}

// Shared base for the two tray-cell containers (the endcap's 2 cells, an interior
// tile's 4). Each position holds a slot VM whose type follows its kind — a
// SampleTaxaIcon (taxon/blank) or a SampleTrayPlus (add). A slot is retained
// across same-type changes (positional reuse) and swapped when its kind crosses
// the taxon/add boundary; the polymorphic collection's key (position:component)
// drives create/retain/dispose. Subclasses supply only geometry + background.
class SampleTrayCellViewModel extends ChangeNotifier {
  constructor(tray, collectionIndices) {
    super();
    this._tray = tray;
    this._collectionIndices = collectionIndices;
    this._slots = [];
    this._fill();
  }

  // The inner collection the slot components bind to.
  get taxa() { return this._slots; }

  // dip css strings for the cell component to bind onto the Ti view; height is the
  // viewport height for both the endcap and the interior tiles.
  get leftCss() { return `${this.left}dp`; }
  get widthCss() { return `${this.width}dp`; }
  get heightCss() { return `${this._tray.endcapHeight}dp`; }

  // A taxa add/change/remove: re-derive every slot (swapping type where a kind
  // crosses the boundary), then notify so the taxa collection reconciles.
  update() {
    this._fill();
    this.notifyListeners();
  }

  // On a viewport change: re-apply this cell's geometry and each slot's width.
  notifyGeometry() {
    this.notifyListeners();
    this._slots.forEach(s => s.notifyListeners());
  }

  _fill() {
    this._collectionIndices.forEach((collectionIndex, j) => {
      const kind = this._tray.cellKind(collectionIndex);
      const data = this._tray.cellData(collectionIndex);
      const existing = this._slots[j];
      if (!existing || existing.component !== componentForKind(kind)) {
        this._slots[j] = makeSlot(kind, this._tray, collectionIndex, j);
      }
      this._slots[j].update(kind, data);
    });
  }
}

module.exports = SampleTrayCellViewModel;
