const ChangeNotifier = require("../../util/ChangeNotifier");
const { endcapTile, interiorTile } = require("./SampleTrayTile");

const identity = (x) => x;

// The tile + slot VMs (SampleTrayTile — endcap or interior — and its
// SampleTaxaIcon/SampleTrayPlus slots) read their geometry, kind and content
// back through the public accessors here — but they're handed `owner` (which
// defaults to this instance), not `this`, so a composing screen view-model can
// make itself the tray its children report to.
class IceCubeTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource, toDip, toSystem, owner }) {
    super();
    this._taxaSource = taxaSource;
    this._toDip = toDip || identity;
    this._toSystem = toSystem || identity;
    this._owner = owner || this;
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._viewportWidthPx = 0;
    this._trayWidthPx = 0;
    this._scrollx = 0;
    this._tileCache = new Map();
    // Lazy, not built here: an owner (e.g. SampleTrayViewModel) constructs its
    // composed engine before it can finish assigning itself, so anything the
    // endcap's construction calls back on the owner for (cellKind/cellData)
    // would see a half-built owner if this ran eagerly.
    this._endcapVm = null;
    this._visibleTiles = [];
    this._onSourceChange = () => this.refresh();
    if (typeof taxaSource.onChange === "function") taxaSource.onChange(this._onSourceChange);
  }

  // ── Geometry (bit-for-bit with the old controller's getters) ──────────────

  // The presenter hands a clean, laid-out viewport size (system px) — the
  // Titanium measurement hack lives in measureView, not here. Convert to dip and
  // re-derive geometry.
  setViewport(size) {
    this._viewportWidth = this._toDip(size.width);
    this._viewportHeight = this._toDip(size.height);
    this._viewportWidthPx = size.width;
    // Two-level cascade: cached cells re-apply their geometry (and their slots'),
    // then the screen re-applies trayWidth and re-windows. The reveal follows from
    // the width Titanium lays the tray out at, not from the viewport change itself.
    this.reapplyCells();
    this._recomputeWindow();
    this.notifyListeners();
  }

  // The tray's own laid-out width, reported back by the view. It is the width the
  // reveal can actually reach, so a tray that has just been widened is a tray with
  // a new right edge to show. One that lands on the width it already had leaves
  // the tray where it was scrolled to.
  setTrayWidth(size) {
    if (size.width === this._trayWidthPx) return;
    this._trayWidthPx = size.width;
    this.notifyListeners();
    this.trigger("scrollToRightEnd");
  }

  // Re-apply every cached cell's bindings (and its slots') without re-deriving
  // content — used on a viewport change (geometry) and by an owner that needs
  // its cells to re-read some of their own state (e.g. a training verdict).
  reapplyCells() {
    this._tileCache.forEach(t => t.reapply());
    this._endcap().reapply();
  }

  get viewWidth() { return this._viewportWidth; }
  get endcapHeight() { return this._viewportHeight; }
  get endcapWidth() { return this.endcapHeight * 0.5; }
  get middleWidth() { return this.endcapWidth * 1.3; }
  // Each cell fills half the tile's middle width (two columns), less 1dp.
  get cellWidth() { return this.middleWidth / 2 - 1; }

  get tileCount() {
    return Math.floor((this._owner.cellCount - 2) / 4) + 1;
  }

  get trayWidth() {
    const width = this.tileCount * this.middleWidth + this.endcapWidth;
    return width < this.viewWidth ? this.viewWidth : width;
  }

  get trayWidthCss() { return `${this.trayWidth}dp`; }

  // The far right edge, in the units the view reports. Both lengths are measured
  // rather than derived from the dip geometry — converting the difference instead
  // lands a pixel past where the view can actually scroll.
  get scrollTargetX() { return Math.max(0, this._trayWidthPx - this._viewportWidthPx); }

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
  get endcapVm() { return this._endcap(); }
  get visibleTiles() { return this._visibleTiles; }

  _endcap() {
    if (!this._endcapVm) this._endcapVm = endcapTile(this._owner);
    return this._endcapVm;
  }

  // Titanium hands the raw scroll offset (system px) via an input() binding.
  setScrollOffset(px) {
    this._scrollx = this._toDip(px);
    this._recomputeWindow();
    this.notifyListeners();
  }

  // Re-derive cell content across every cached tile (a taxa add/change/remove),
  // then re-window and reveal the right edge. Positional icon reuse is preserved
  // inside each cell's slot VMs. Fires "refreshing" *first* — distinct from the
  // generic notifyListeners — so an owner can react to the taxa content about
  // to change (e.g. drop a training verdict overlay) before the tile/slot
  // updates below synchronously re-read that owner's state via their own
  // notifyListeners cascade.
  refresh() {
    this.trigger("refreshing");
    this._tileCache.forEach(t => t.update());
    this._endcap().update();
    this._recomputeWindow();
    this.notifyListeners();
    // New taxa are the whole point of the reveal: the newest bug comes into view
    // wherever the tray had been scrolled to.
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
      vm = interiorTile(this._owner, n);
      this._tileCache.set(n, vm);
    }
    return vm;
  }

  get cellCount() { return this._taxaSource.length(); }

  cellData(collectionIndex) {
    return this._taxaSource.at(collectionIndex);
  }

  // ── Cell selection — the owning screen view-model decides what a tap means

  // A blank cell is inert; anything else (taxon/plus/addBehind) reports its
  // collection index so the owner can look up what's there and act.
  selectCell(collectionIndex) {
    if (this._owner.cellKind(collectionIndex) === "blank") return;
    this.trigger("iceCubeTrayCellSelected", collectionIndex);
  }
}

module.exports = IceCubeTrayViewModel;
