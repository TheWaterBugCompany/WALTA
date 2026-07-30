const ChangeNotifier = require("../util/ChangeNotifier");

// Titanium-free view-model for the ice-cube SampleTray. Owns the tile/index
// arithmetic and (spike in progress) the layout geometry, so the controller is
// left with only Titanium-specific work (measuring size, scrolling, creating
// views). The `taxaSource` is a thin adapter over Alloy.Collections["taxa"]:
// { length(), at(i) }.
class SampleTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource }) {
    super();
    this._taxaSource = taxaSource;
  }

  // The endcap holds the first 2 taxa; each interior tile holds 4.
  get tileCount() {
    return Math.floor((this._taxaSource.length() - 2) / 4) + 1;
  }

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
}

module.exports = SampleTrayViewModel;
