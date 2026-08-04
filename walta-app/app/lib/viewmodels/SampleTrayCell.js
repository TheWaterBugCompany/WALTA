const ChangeNotifier = require("../util/ChangeNotifier");
const SampleTaxaIconViewModel = require("./SampleTaxaIcon");
const SampleTrayPlusViewModel = require("./SampleTrayPlus");

const ENDCAP_BACKGROUND = "/images/endcap_320.png";
const TILE_BACKGROUND = "/images/tiling_interior_320.png";

const ADD_KINDS = new Set(["plus", "addBehind"]);

function componentForKind(kind) {
  return ADD_KINDS.has(kind) ? "SampleTrayPlus" : "SampleTaxaIcon";
}

function makeSlot(kind, tray, collectionIndex, position) {
  return componentForKind(kind) === "SampleTrayPlus"
    ? new SampleTrayPlusViewModel(tray, collectionIndex, position)
    : new SampleTaxaIconViewModel(tray, collectionIndex, position);
}

// One tray-cell container — the endcap (2 cells) or an interior tile (4). Both are
// the same view-model: a positioned background over a row of polymorphic slots.
// Each position holds a slot VM whose type follows its kind — a SampleTaxaIcon
// (taxon/blank) or a SampleTrayPlus (add). A slot is retained across same-type
// changes (positional reuse) and swapped when its kind crosses the taxon/add
// boundary; the polymorphic collection's key (position:component) drives
// create/retain/dispose. Geometry (`left`/`width`) is supplied by the factory (it
// tracks the tray's measured viewport), so the two shapes differ only in their spec,
// not in a subclass.
class SampleTrayCellViewModel extends ChangeNotifier {
  constructor(tray, spec) {
    super();
    this._tray = tray;
    this._spec = spec;
    this._collectionIndices = spec.collectionIndices;
    this._slots = [];
    this._fill();
  }

  get key() { return this._spec.key; }
  get backgroundImage() { return this._spec.backgroundImage; }
  get left() { return this._spec.left(); }
  get width() { return this._spec.width(); }

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

// The fixed left endcap: the first two cells at the tray origin.
function endcapCell(tray) {
  return new SampleTrayCellViewModel(tray, {
    key: "endcap",
    collectionIndices: [0, 1],
    backgroundImage: ENDCAP_BACKGROUND,
    left: () => 0,
    width: () => tray.endcapWidth,
  });
}

// An interior 4-cell (2x2) tile, positioned after the endcap.
function tileCell(tray, tileNum) {
  return new SampleTrayCellViewModel(tray, {
    key: tileNum,
    collectionIndices: tray.collectionIndicesForTile(tileNum),
    backgroundImage: TILE_BACKGROUND,
    left: () => tray.tileLeft(tileNum),
    width: () => tray.tileWidth,
  });
}

module.exports = SampleTrayCellViewModel;
module.exports.endcapCell = endcapCell;
module.exports.tileCell = tileCell;
