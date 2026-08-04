const SampleTrayCellViewModel = require("./SampleTrayCell");

const TILE_BACKGROUND = "/images/tiling_interior_320.png";

// An interior ice-cube tile: a 4-cell (2x2) hole grid, positioned after the endcap.
class SampleTrayTileViewModel extends SampleTrayCellViewModel {
  constructor(tray, tileNum) {
    super(tray, tray.collectionIndicesForTile(tileNum));
    this.tileNum = tileNum;
  }
  get key() { return this.tileNum; }
  get left() { return this._tray.tileLeft(this.tileNum); }
  get width() { return this._tray.tileWidth; }
  get backgroundImage() { return TILE_BACKGROUND; }
}

module.exports = SampleTrayTileViewModel;
