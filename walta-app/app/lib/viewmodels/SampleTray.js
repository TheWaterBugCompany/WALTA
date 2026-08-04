const ChangeNotifier = require("../util/ChangeNotifier");

const ENDCAP_BACKGROUND = "/images/endcap_320.png";
const TILE_BACKGROUND = "/images/tiling_interior_320.png";
const PLUS_ICON = "/images/plus-icon.png";

const identity = (x) => x;

// Titanium-free view-model for the ice-cube SampleTray. Owns all layout geometry
// (derived from the measured viewport in dip), the scroll windowing, and the
// per-cell content + intent — so the controller keeps no Titanium input wiring.
// Titanium hands it raw system-px (scroll offset, viewport size) through bindView's
// input/measure bindings; the VM converts with the injected toDip/toSystem so it
// stays Node-testable. `taxaSource` is the injected SampleTraySource:
// { length(), at(i) -> plain per-taxon data, surveyType(), onChange(cb), readonly }.
class SampleTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource, topics, toDip, toSystem }) {
    super();
    this._taxaSource = taxaSource;
    this._topics = topics;
    this._toDip = toDip || identity;
    this._toSystem = toSystem || identity;
    this._readonly = taxaSource.readonly === true;
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._scrollx = 0;
    this._tileCache = new Map();
    this._endcapVm = new EndcapViewModel(this);
    this._visibleTiles = [];
    this._onSourceChange = () => this.refresh();
    if (typeof taxaSource.onChange === "function") taxaSource.onChange(this._onSourceChange);
  }

  // ── Geometry (bit-for-bit with the old controller's getters) ──────────────

  // Titanium hands the raw view size (system px) via a measure() binding; convert
  // to dip and re-derive geometry. Returns whether the reading was usable, so the
  // binding retries until the view is actually laid out.
  setViewport(size) {
    const width = this._toDip(size.width);
    const height = this._toDip(size.height);
    if (!height) return false;
    this._viewportWidth = width;
    this._viewportHeight = height;
    // Two-level cascade: cached cells re-apply their geometry (and their slots'),
    // then the screen re-applies trayWidth + re-windows, then asks Ti to reveal the
    // right edge.
    this._tileCache.forEach(t => t.notifyGeometry());
    this._endcapVm.notifyGeometry();
    this._recomputeWindow();
    this.notifyListeners();
    this.trigger("scrollToRightEnd");
    return true;
  }

  get viewWidth() { return this._viewportWidth; }
  get endcapHeight() { return this._viewportHeight; }
  get endcapWidth() { return this.endcapHeight * 0.5; }
  get middleWidth() { return this.endcapWidth * 1.3; }
  // Each cell fills half the tile's middle width (two columns), less 1dp.
  get cellWidth() { return this.middleWidth / 2 - 1; }

  get tileCount() {
    return Math.floor((this._taxaSource.length() - 2) / 4) + 1;
  }

  get trayWidth() {
    const width = this.tileCount * this.middleWidth + this.endcapWidth;
    return width < this.viewWidth ? this.viewWidth : width;
  }

  get trayWidthCss() { return `${this.trayWidth}dp`; }

  // The system-px offset the scroll command animates to — the far right edge.
  get scrollTargetX() { return this._toSystem(this.trayWidth - this.viewWidth); }

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

  // Titanium hands the raw scroll offset (system px) via an input() binding.
  setScrollOffset(px) {
    this._scrollx = this._toDip(px);
    this._recomputeWindow();
    this.notifyListeners();
  }

  // Re-derive cell content across every cached tile (a taxa add/change/remove),
  // then re-window and reveal the right edge. Positional icon reuse is preserved
  // inside each cell's slot VMs.
  refresh() {
    this._tileCache.forEach(t => t.update());
    this._endcapVm.update();
    this._recomputeWindow();
    this.notifyListeners();
    this.trigger("scrollToRightEnd");
  }

  dispose() {
    if (typeof this._taxaSource.offChange === "function") {
      this._taxaSource.offChange(this._onSourceChange);
    }
    super.dispose();
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

  // ── Cell content (mirrors the old addTrayIcon / updateTrayIcon table) ──────

  _cellKind(collectionIndex) {
    const len = this._taxaSource.length();
    if (collectionIndex < len) {
      return this._taxaSource.at(collectionIndex) ? "taxon" : "blank";
    }
    if (collectionIndex === len) return this._readonly ? "blank" : "plus";
    return this._readonly ? "blank" : "addBehind";
  }

  _cellData(collectionIndex) {
    return this._taxaSource.at(collectionIndex);
  }

  _surveyType() {
    return typeof this._taxaSource.surveyType === "function"
      ? this._taxaSource.surveyType()
      : null;
  }
}

// A container of taxa cells (the endcap's 2, an interior tile's 4). Holds a stable
// array of SampleTaxaIconViewModel slots — one per position, retained across kind
// changes so a taxon icon is reused in place (the positional correctness the spec
// pins). Structural + content changes flow through each slot's own notify; the
// cell notifies only its own geometry (on a viewport change).
class CellsViewModel extends ChangeNotifier {
  constructor(tray, collectionIndices) {
    super();
    this._tray = tray;
    this._collectionIndices = collectionIndices;
    this._slots = collectionIndices.map((ci, j) => new SampleTaxaIconViewModel(tray, ci, j));
    this._fill();
  }

  // The inner collection the SampleTaxaIcon components bind to.
  get taxa() { return this._slots; }
  // The screen's readonly mode, for the cell's edit-intent payload (kinds already
  // encode it — plus/add-behind only appear when editable).
  get readonly() { return this._tray._readonly; }

  // dip css strings for the component to bind onto the Ti view. height is the
  // viewport height for both the endcap and the interior tiles.
  get leftCss() { return `${this.left}dp`; }
  get widthCss() { return `${this.width}dp`; }
  get heightCss() { return `${this._tray.endcapHeight}dp`; }

  update() {
    this._fill();
  }

  // On a viewport change: re-apply this cell's geometry and each slot's width.
  notifyGeometry() {
    this.notifyListeners();
    this._slots.forEach(s => s.notifyListeners());
  }

  _fill() {
    this._collectionIndices.forEach((collectionIndex, j) => {
      this._slots[j].update(
        this._tray._cellKind(collectionIndex),
        this._tray._cellData(collectionIndex)
      );
    });
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

// One tray cell (a "slot"). Carries its own kind (taxon/plus/blank/addBehind),
// its taxon content when filled, its geometry, and its own tap intent — so the
// SampleTaxaIcon component binds it directly and needs no per-cell wiring.
class SampleTaxaIconViewModel extends ChangeNotifier {
  constructor(tray, collectionIndex, position) {
    super();
    this._tray = tray;
    this._collectionIndex = collectionIndex;
    this._position = position;
    this._kind = null;
    this._data = null;
  }

  get key() { return this._position; }
  get kind() { return this._kind; }
  get widthCss() { return `${this._tray.cellWidth}dp`; }

  // ── Taxon content (null/empty for non-taxon kinds) ────────────────────────
  get iconVisible() { return this._kind === "taxon"; }
  get image() { return this._data ? this._data.silhouette : null; }
  get abundanceText() { return this._data ? this._data.abundance : ""; }
  get abundanceVisible() { return this._kind === "taxon"; }
  get sampleTaxonId() { return this._data ? this._data.sampleTaxonId : null; }
  get taxonId() { return this._data ? this._data.taxonId : null; }

  get accessibilityLabel() {
    if (this._kind === "taxon") {
      return `Taxon ${this._data.taxonId}, ${this._data.name}, abundance ${this._data.abundance}`;
    }
    if (this._kind === "plus") return "Add Sample";
    return "";
  }

  // The add cell shows the plus icon (a small centred image beneath the tap
  // surface); every other kind hides it.
  get plusVisible() { return this._kind === "plus"; }
  get plusImage() { return this._kind === "plus" ? PLUS_ICON : undefined; }

  // Re-derive this slot's kind/content in place; notify iff something changed
  // (positional reuse for a taxon that stays a taxon).
  update(kind, data) {
    if (kind === "taxon") {
      if (this._kind === "taxon" && this._dataEquals(data)) return;
      this._kind = "taxon";
      this._data = data;
      this.notifyListeners();
      return;
    }
    if (kind === this._kind) return;
    this._kind = kind;
    this._data = null;
    this.notifyListeners();
  }

  // The cell owns its intent (like SampleHistoryRow): a taxon opens the editor,
  // a plus / add-behind opens the add-to-sample chooser, a blank does nothing.
  tap() {
    const topics = this._tray._topics;
    if (this._kind === "taxon") {
      topics.fireTopicEvent(topics.IDENTIFY, {
        sampleTaxonId: this.sampleTaxonId,
        taxonId: this.taxonId,
        readonly: this._tray._readonly,
      });
    } else if (this._kind === "plus" || this._kind === "addBehind") {
      topics.fireTopicEvent(topics.SELECT_METHOD, {
        allowAddToSample: true,
        surveyType: this._tray._surveyType(),
        unknownBug: true,
      });
    }
  }

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

module.exports = SampleTrayViewModel;
module.exports.SampleTaxaIconViewModel = SampleTaxaIconViewModel;
