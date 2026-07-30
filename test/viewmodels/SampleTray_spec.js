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

});
