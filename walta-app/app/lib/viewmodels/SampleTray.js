const ChangeNotifier = require("../util/ChangeNotifier");

// Titanium-free view-model for the ice-cube SampleTray. Owns the tile/index
// arithmetic, the layout geometry, and the scroll windowing, so the controller
// is left with only Titanium-specific work (measuring size, scrolling, creating
// views). The `taxaSource` is a thin adapter over Alloy.Collections["taxa"]:
// { length(), at(i) }.
class SampleTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource }) {
    super();
    this._taxaSource = taxaSource;
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._materialized = new Set();
  }

  // The controller measures the ScrollView's content pane once it is laid out
  // and feeds the dimensions (in dip) here; every layout number is derived from
  // these so the geometry is framework-agnostic.
  setViewport({ width, height }) {
    this._viewportWidth = width;
    this._viewportHeight = height;
  }

  get viewWidth() { return this._viewportWidth; }
  get endcapHeight() { return this._viewportHeight; }
  get endcapWidth() { return this.endcapHeight * 0.5; }
  get middleWidth() { return this.endcapWidth * 1.3; }

  // The endcap holds the first 2 taxa; each interior tile holds 4.
  get tileCount() {
    return Math.floor((this._taxaSource.length() - 2) / 4) + 1;
  }

  // trayWidth = the tiles plus the endcap, clamped up to the viewport width so
  // a short tray still fills the screen.
  get trayWidth() {
    const width = this.tileCount * this.middleWidth + this.endcapWidth;
    return width < this.viewWidth ? this.viewWidth : width;
  }

  // Tile n sits after the endcap; each tile overlaps its neighbour by 1dip.
  tileLeft(n) { return n * this.middleWidth + this.endcapWidth; }
  get tileWidth() { return this.middleWidth + 1; }

  // Tile n starts at collection index n*4 + 2 (the +2 skips the endcap cells).
  mapTileNumToCollection(n) {
    return n * 4 + 2;
  }

  // A tile is a 2x2 grid filled column-major (down the left column, then the
  // right) — the ice-cube-tray order: visual cells [top-left, top-right,
  // bottom-left, bottom-right] map to collection offsets [0, 2, 1, 3].
  collectionIndicesForTile(n) {
    const base = this.mapTileNumToCollection(n);
    return [0, 2, 1, 3].map(offset => base + offset);
  }

  // Maps a scroll offset (dip) to a tile index.
  roundToTile(x) {
    return Math.floor((x - this.endcapWidth) / this.middleWidth);
  }

  // The tile edges bracketing the current scroll offset; the window
  // materialized is [max(0, leftEdge) .. rightEdge - 1].
  visibleRange(scrollx) {
    return {
      leftEdge: this.roundToTile(scrollx),
      rightEdge: this.roundToTile(scrollx + this.viewWidth + this.middleWidth - 1)
    };
  }

  // Diffs the desired window against the materialized set and returns the tiles
  // to add (each with its computed geometry), update, and release. Called
  // directly from the scroll handler every frame — deliberately NOT routed
  // through notifyListeners, so per-scroll cost stays a single small delta.
  syncWindow(scrollx) {
    const { leftEdge, rightEdge } = this.visibleRange(scrollx);
    const toAdd = [], toUpdate = [], toRelease = [];
    for (let i = Math.max(0, leftEdge); i <= rightEdge - 1; i++) {
      (this._materialized.has(i) ? toUpdate : toAdd).push(this._tileDescriptor(i));
    }
    for (const i of this._materialized) {
      if (i < leftEdge || i > rightEdge - 1) toRelease.push(i);
    }
    toAdd.forEach(t => this._materialized.add(t.tileNum));
    toRelease.forEach(i => this._materialized.delete(i));
    return { toAdd, toUpdate, toRelease };
  }

  // The controller clears its cached tile views on a full rebuild; this drops
  // the matching bookkeeping so the next syncWindow re-materializes the window.
  resetWindow() {
    this._materialized.clear();
  }

  _tileDescriptor(n) {
    return {
      tileNum: n,
      left: this.tileLeft(n),
      width: this.tileWidth,
      collectionIndices: this.collectionIndicesForTile(n)
    };
  }
}

module.exports = SampleTrayViewModel;
