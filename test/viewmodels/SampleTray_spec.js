require("mocha");
const { expect } = require("chai");
const SampleTrayViewModel = require("../../walta-app/app/lib/viewmodels/SampleTray");

// A Titanium-free stand-in for the live Alloy `taxa` collection: the controller
// builds one of these from Alloy.Collections["taxa"] + the key.
function fakeTaxaSource(taxa) {
  return {
    length() { return taxa.length; },
    at(i) { return taxa[i]; }
  };
}

function vmWith(len) {
  return new SampleTrayViewModel({ taxaSource: fakeTaxaSource(new Array(len).fill({})) });
}

// Viewport height 100, width 300 gives round geometry numbers:
//   endcapWidth = 100 * 0.5 = 50, middleWidth = 50 * 1.3 = 65.
function vmWithViewport(len, { width = 300, height = 100 } = {}) {
  const vm = vmWith(len);
  vm.setViewport({ width, height });
  return vm;
}

describe("SampleTrayViewModel", function () {

  describe("tileCount", function () {
    // The endcap holds the first 2 taxa; each interior tile holds 4. This is the
    // current controller's getTrayWidth math: floor((length - 2) / 4) + 1.
    it("counts the interior 4-cell tiles after the 2 endcap cells", function () {
      expect(vmWith(0).tileCount, "0 taxa").to.equal(0);
      expect(vmWith(1).tileCount, "1 taxon").to.equal(0);
      expect(vmWith(2).tileCount, "2 taxa (fill the endcap)").to.equal(1);
      expect(vmWith(6).tileCount, "6 taxa").to.equal(2);
      expect(vmWith(26).tileCount, "26 taxa").to.equal(7);
      expect(vmWith(27).tileCount, "27 taxa").to.equal(7);
    });
  });

  describe("collection-index mapping", function () {
    // Tile n starts at collection index n*4 + 2 (the +2 skips the endcap cells).
    it("maps a tile number to its first collection index", function () {
      const vm = vmWith(30);
      expect(vm.mapTileNumToCollection(0)).to.equal(2);
      expect(vm.mapTileNumToCollection(1)).to.equal(6);
      expect(vm.mapTileNumToCollection(5)).to.equal(22);
    });

    // A tile is a 2x2 grid filled column-major (down the left column, then the
    // right) — the ice-cube-tray order the current fillSampleTrayIcons uses:
    // visual cells [top-left, top-right, bottom-left, bottom-right] map to
    // collection offsets [0, 2, 1, 3] from the tile's base index.
    it("lists a tile's 4 cells in column-major visual order", function () {
      const vm = vmWith(30);
      expect(vm.collectionIndicesForTile(0)).to.deep.equal([2, 4, 3, 5]);
      expect(vm.collectionIndicesForTile(1)).to.deep.equal([6, 8, 7, 9]);
    });
  });

  describe("geometry", function () {
    // Derived from the measured viewport (dip). endcapWidth = height/2,
    // middleWidth = endcapWidth * 1.3 — bit-for-bit with the controller's
    // getEndcapWidth/getMiddleWidth.
    it("derives endcap and middle widths from the viewport height", function () {
      const vm = vmWithViewport(30);
      expect(vm.endcapWidth, "endcapWidth = height * 0.5").to.equal(50);
      expect(vm.middleWidth, "middleWidth = endcapWidth * 1.3").to.equal(65);
    });

    // Tile n's left edge = n * middleWidth + endcapWidth; width = middleWidth + 1
    // (the controller's createSampleTrayTile).
    it("positions each tile after the endcap", function () {
      const vm = vmWithViewport(30);
      expect(vm.tileLeft(0)).to.equal(50);
      expect(vm.tileLeft(1)).to.equal(115);
      expect(vm.tileLeft(2)).to.equal(180);
      expect(vm.tileWidth).to.equal(66);
    });

    // trayWidth = tileCount * middleWidth + endcapWidth, clamped up to the
    // viewport width so a short tray still fills the screen.
    it("sums the tiles plus the endcap for the tray width", function () {
      expect(vmWithViewport(30).trayWidth, "8 tiles * 65 + 50").to.equal(570);
    });

    it("clamps the tray width up to the viewport width for a short tray", function () {
      expect(vmWithViewport(2).trayWidth, "1 tile * 65 + 50 = 115 < 300").to.equal(300);
    });
  });

  describe("windowing", function () {
    // roundToTile(x) = floor((x - endcapWidth) / middleWidth) — maps a scroll
    // offset (dip) to a tile index. Left of the first tile rounds negative.
    it("maps a scroll offset to a tile index", function () {
      const vm = vmWithViewport(30);
      expect(vm.roundToTile(0), "before tile 0").to.equal(-1);
      expect(vm.roundToTile(50), "start of tile 0").to.equal(0);
      expect(vm.roundToTile(115), "start of tile 1").to.equal(1);
    });

    // visibleRange mirrors updateVisibleTiles: leftEdge = roundToTile(scrollx),
    // rightEdge = roundToTile(scrollx + viewWidth + middleWidth - 1). The window
    // materialized is [max(0,leftEdge) .. rightEdge - 1].
    it("computes the left and right tile edges for a scroll offset", function () {
      const vm = vmWithViewport(30);
      expect(vm.visibleRange(0)).to.deep.equal({ leftEdge: -1, rightEdge: 4 });
      expect(vm.visibleRange(200)).to.deep.equal({ leftEdge: 2, rightEdge: 7 });
    });
  });

  describe("syncWindow", function () {
    // syncWindow diffs the desired window [max(0,leftEdge) .. rightEdge-1]
    // against the materialized set, returning tiles to add / update / release
    // and updating the set. Not routed through notifyListeners — it's a pure
    // per-scroll query the controller calls directly.
    it("materializes the initial window from an empty set", function () {
      const vm = vmWithViewport(30);
      const { toAdd, toUpdate, toRelease } = vm.syncWindow(0);
      expect(toAdd.map(t => t.tileNum), "tiles 0..3 (rightEdge - 1)").to.deep.equal([0, 1, 2, 3]);
      expect(toUpdate).to.deep.equal([]);
      expect(toRelease).to.deep.equal([]);
    });

    it("carries each tile's computed geometry and collection indices", function () {
      const vm = vmWithViewport(30);
      const [tile0] = vm.syncWindow(0).toAdd;
      expect(tile0).to.deep.equal({
        tileNum: 0,
        left: 50,
        width: 66,
        collectionIndices: [2, 4, 3, 5]
      });
    });

    it("adds the newly-entered tiles, updates the retained ones, releases those scrolled off", function () {
      const vm = vmWithViewport(30);
      vm.syncWindow(0); // materialize [0,1,2,3]
      const { toAdd, toUpdate, toRelease } = vm.syncWindow(200); // window [2..6]
      expect(toAdd.map(t => t.tileNum), "tiles newly on screen").to.deep.equal([4, 5, 6]);
      expect(toUpdate.map(t => t.tileNum), "tiles still on screen").to.deep.equal([2, 3]);
      expect(toRelease.sort(), "tiles scrolled off").to.deep.equal([0, 1]);
    });

    it("never materializes negative tile indices", function () {
      const vm = vmWithViewport(30);
      // scrollx 0 gives leftEdge -1; the window must start at tile 0, not -1.
      expect(vm.syncWindow(0).toAdd.map(t => t.tileNum)).to.deep.equal([0, 1, 2, 3]);
    });
  });

});
