const ChangeNotifier = require("../util/ChangeNotifier");
const { endcapTile, interiorTile } = require("./SampleTrayTile");

const identity = (x) => x;

// Titanium-free view-model for the ice-cube SampleTray. Owns all layout geometry
// (derived from the measured viewport in dip), the scroll windowing, and the
// per-cell content + intent — so the controller keeps no Titanium input wiring.
// The presenter hands it a clean viewport size (system px) and the scroll offset
// through bindView; the VM converts with the injected toDip/toSystem so it stays
// Node-testable. `taxaSource` is the injected SampleTraySource:
// { length(), at(i) -> plain per-taxon data, surveyType(), onChange(cb), readonly }.
// The tile + slot VMs (SampleTrayTile — endcap or interior — and its
// SampleTaxaIcon/SampleTrayPlus slots) read their geometry, kinds and intent
// payload back through the public accessors here.
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
    this._endcapVm = endcapTile(this);
    this._visibleTiles = [];
    this._onSourceChange = () => this.refresh();
    if (typeof taxaSource.onChange === "function") taxaSource.onChange(this._onSourceChange);
  }

  // ── Accessors the cell + slot VMs read ────────────────────────────────────
  get topics() { return this._topics; }
  get readonly() { return this._readonly; }
  surveyType() {
    return typeof this._taxaSource.surveyType === "function"
      ? this._taxaSource.surveyType()
      : null;
  }

  // ── Geometry (bit-for-bit with the old controller's getters) ──────────────

  // The presenter hands a clean, laid-out viewport size (system px) — the
  // Titanium measurement hack lives in measureView, not here. Convert to dip and
  // re-derive geometry.
  setViewport(size) {
    this._viewportWidth = this._toDip(size.width);
    this._viewportHeight = this._toDip(size.height);
    // Two-level cascade: cached cells re-apply their geometry (and their slots'),
    // then the screen re-applies trayWidth + re-windows, then asks Ti to reveal the
    // right edge.
    this._tileCache.forEach(t => t.notifyGeometry());
    this._endcapVm.notifyGeometry();
    this._recomputeWindow();
    this.notifyListeners();
    this.trigger("scrollToRightEnd");
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

  // The single, always-present endcap VM — bound as one fixed component.
  get endcapVm() { return this._endcapVm; }
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
      vm = interiorTile(this, n);
      this._tileCache.set(n, vm);
    }
    return vm;
  }

  // ── Cell content (mirrors the old addTrayIcon / updateTrayIcon table) ──────

  cellKind(collectionIndex) {
    const len = this._taxaSource.length();
    if (collectionIndex < len) {
      return this._taxaSource.at(collectionIndex) ? "taxon" : "blank";
    }
    if (collectionIndex === len) return this._readonly ? "blank" : "plus";
    return this._readonly ? "blank" : "addBehind";
  }

  cellData(collectionIndex) {
    return this._taxaSource.at(collectionIndex);
  }
}

module.exports = SampleTrayViewModel;
