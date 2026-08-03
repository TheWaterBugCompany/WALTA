const ChangeNotifier = require("../util/ChangeNotifier");

const ENDCAP_BACKGROUND = "/images/endcap_320.png";
const TILE_BACKGROUND = "/images/tiling_interior_320.png";

// Titanium-free view-model for the ice-cube SampleTray. Owns all layout
// geometry (derived from the measured viewport in dip), the scroll windowing,
// and the hole/icon content — so the controller keeps only Titanium work
// (measuring, scrolling, view create/remove). The `taxaSource` is the injected
// SampleTraySource: { length(), at(i) -> plain per-taxon data, readonly }.
class SampleTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource }) {
    super();
    this._taxaSource = taxaSource;
    this._readonly = taxaSource.readonly === true;
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._scrollx = 0;
    this._tileCache = new Map();
    this._endcapVm = new EndcapViewModel(this);
    this._visibleTiles = [];
  }

  // ── Geometry (bit-for-bit with the old controller's getters) ──────────────

  setViewport({ width, height }) {
    this._viewportWidth = width;
    this._viewportHeight = height;
    // Two-level notification: cached children re-apply their geometry, then the
    // screen re-applies its own (trayWidth) and reconciles.
    this._tileCache.forEach(t => t.notifyListeners());
    this._endcapVm.notifyListeners();
    this._recomputeWindow();
    this.notifyListeners();
  }

  get viewWidth() { return this._viewportWidth; }
  get endcapHeight() { return this._viewportHeight; }
  get endcapWidth() { return this.endcapHeight * 0.5; }
  get middleWidth() { return this.endcapWidth * 1.3; }

  get tileCount() {
    return Math.floor((this._taxaSource.length() - 2) / 4) + 1;
  }

  get trayWidth() {
    const width = this.tileCount * this.middleWidth + this.endcapWidth;
    return width < this.viewWidth ? this.viewWidth : width;
  }

  get trayWidthCss() { return `${this.trayWidth}dp`; }

  tileLeft(n) { return n * this.middleWidth + this.endcapWidth; }
  get tileWidth() { return this.middleWidth + 1; }

  mapTileNumToCollection(n) { return n * 4 + 2; }

  // The 2x2 ice-cube grid, filled column-major: visual cells map to collection
  // offsets [0, 2, 1, 3] from the tile's base index.
  collectionIndicesForTile(n) {
    const base = this.mapTileNumToCollection(n);
    return [0, 2, 1, 3].map(offset => base + offset);
  }

  roundToTile(x) {
    return Math.floor((x - this.endcapWidth) / this.middleWidth);
  }

  visibleRange(scrollx) {
    return {
      leftEdge: this.roundToTile(scrollx),
      rightEdge: this.roundToTile(scrollx + this.viewWidth + this.middleWidth - 1),
    };
  }

  // ── Windowing (the binder's keyed diff subsumes the spike's materialized set)

  get endcapTiles() { return [this._endcapVm]; }
  get visibleTiles() { return this._visibleTiles; }

  setScrollOffset(dip) {
    this._scrollx = dip;
    this._recomputeWindow();
    this.notifyListeners();
  }

  // Re-derive hole content across every cached tile (a taxa add/change/remove),
  // then re-window and notify. Positional icon reuse is preserved inside each
  // cell VM's update().
  refresh() {
    this._tileCache.forEach(t => t.update());
    this._endcapVm.update();
    this._recomputeWindow();
    this.trigger("changed");
    this.notifyListeners();
  }

  _recomputeWindow() {
    const { leftEdge, rightEdge } = this.visibleRange(this._scrollx);
    const tiles = [];
    for (let n = Math.max(0, leftEdge); n <= rightEdge - 1; n++) {
      tiles.push(this._tileVm(n));
    }
    this._visibleTiles = tiles;
  }

  _tileVm(n) {
    let vm = this._tileCache.get(n);
    if (!vm) {
      vm = new TileViewModel(this, n);
      this._tileCache.set(n, vm);
    }
    return vm;
  }

  // ── Hole content (mirrors the old addTrayIcon / updateTrayIcon table) ──────

  _holeKind(collectionIndex) {
    const len = this._taxaSource.length();
    if (collectionIndex < len) {
      return this._taxaSource.at(collectionIndex) ? "taxon" : "blank";
    }
    if (collectionIndex === len) return this._readonly ? "blank" : "plus";
    return this._readonly ? "blank" : "addBehind";
  }

  _iconData(collectionIndex) {
    return this._taxaSource.at(collectionIndex);
  }
}

// A container of icon cells (the endcap's 2, an interior tile's 4). Holds a
// stable array of hole slots so a taxon icon is reused in place across updates
// (positional reuse — the position-correctness the spec pins). Structural
// changes (a cell changing kind) notify so the component re-renders; an
// abundance/silhouette change flows through the cell's own icon VM.
class CellsViewModel extends ChangeNotifier {
  constructor(tray, collectionIndices) {
    super();
    this._tray = tray;
    this._collectionIndices = collectionIndices;
    this._holes = collectionIndices.map(() => null);
    this._fill();
  }

  get holes() { return this._holes; }
  // The screen's readonly mode, for the cell's edit-intent payload (hole kinds
  // already encode it — plus/add-behind only appear when editable).
  get readonly() { return this._tray._readonly; }

  // dip css strings for the component to bind onto the Ti view. height is the
  // viewport height for both the endcap and the interior tiles.
  get leftCss() { return `${this.left}dp`; }
  get widthCss() { return `${this.width}dp`; }
  get heightCss() { return `${this._tray.endcapHeight}dp`; }
  // Each cell fills half the tile's middle width (two columns), less 1dp.
  get holeWidthCss() { return `${this._tray.middleWidth / 2 - 1}dp`; }

  update() {
    if (this._fill()) this.notifyListeners();
  }

  // Returns true if a cell changed kind (a structural change).
  _fill() {
    let structural = false;
    this._collectionIndices.forEach((collectionIndex, j) => {
      const kind = this._tray._holeKind(collectionIndex);
      const slot = this._holes[j];
      if (kind === "taxon") {
        const data = this._tray._iconData(collectionIndex);
        if (slot && slot.kind === "taxon") {
          slot.iconVm.update(data);
        } else {
          this._holes[j] = { kind, iconVm: new SampleTaxaIconViewModel(data) };
          structural = true;
        }
      } else if (!slot || slot.kind !== kind) {
        this._holes[j] = { kind, iconVm: null };
        structural = true;
      }
    });
    return structural;
  }
}

class EndcapViewModel extends CellsViewModel {
  constructor(tray) {
    super(tray, [0, 1]);
  }
  get key() { return "endcap"; }
  get left() { return 0; }
  get width() { return this._tray.endcapWidth; }
  get backgroundImage() { return ENDCAP_BACKGROUND; }
}

class TileViewModel extends CellsViewModel {
  constructor(tray, tileNum) {
    super(tray, tray.collectionIndicesForTile(tileNum));
    this.tileNum = tileNum;
  }
  get key() { return this.tileNum; }
  get left() { return this._tray.tileLeft(this.tileNum); }
  get width() { return this._tray.tileWidth; }
  get backgroundImage() { return TILE_BACKGROUND; }
}

class SampleTaxaIconViewModel extends ChangeNotifier {
  constructor(data) {
    super();
    this._data = data;
  }

  get image() { return this._data.silhouette; }
  get abundanceText() { return this._data.abundance; }
  get abundanceVisible() { return true; }
  get sampleTaxonId() { return this._data.sampleTaxonId; }
  get taxonId() { return this._data.taxonId; }

  get accessibilityLabel() {
    return `Taxon ${this._data.taxonId}, ${this._data.name}, abundance ${this._data.abundance}`;
  }

  update(data) {
    if (this._dataEquals(data)) return false;
    this._data = data;
    this.notifyListeners();
    return true;
  }

  _dataEquals(o) {
    const a = this._data;
    return a.silhouette === o.silhouette
      && a.abundance === o.abundance
      && a.taxonId === o.taxonId
      && a.sampleTaxonId === o.sampleTaxonId
      && a.name === o.name;
  }
}

module.exports = SampleTrayViewModel;
module.exports.SampleTaxaIconViewModel = SampleTaxaIconViewModel;
