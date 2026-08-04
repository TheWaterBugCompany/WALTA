require("mocha");
const { expect } = require("chai");
const SampleTrayViewModel = require("../../walta-app/app/lib/viewmodels/SampleTray");

// A Titanium-free stand-in for the SampleTraySource the controller builds from
// Alloy.Collections["taxa"] + the key: length() + at(i) returning the plain
// per-taxon data the icon VM needs (mirrors SampleHistorySource.toRowData).
function fakeTaxaSource(taxa, readonly) {
  return {
    length() { return taxa.length; },
    at(i) { return taxa[i]; },
    surveyType() { return 3; },
    readonly: readonly === true,
  };
}

// Records the topic events the cell's tap intent fires.
function fakeTopics() {
  return {
    IDENTIFY: "identify",
    SELECT_METHOD: "select_method",
    fired: [],
    fireTopicEvent(event, data) { this.fired.push({ event, data }); },
  };
}

// A taxon's plain data as the source yields it.
function taxon(id, abundance) {
  return {
    taxonId: id,
    sampleTaxonId: id == null ? null : 1000 + id,
    abundance,
    silhouette: id == null ? "/images/unknown-bug-icon.png" : `/taxon_${id}.png`,
    name: id == null ? "unknown" : `Species ${id}`,
  };
}

function taxaOf(n) {
  return Array.from({ length: n }, (_, i) => taxon(i + 1, "1-2"));
}

function vmWith(len, readonly) {
  return new SampleTrayViewModel({ taxaSource: fakeTaxaSource(taxaOf(len), readonly) });
}

function vmWithTopics(len, topics, readonly) {
  return new SampleTrayViewModel({ taxaSource: fakeTaxaSource(taxaOf(len), readonly), topics });
}

// Viewport height 100, width 300 gives round geometry numbers:
//   endcapWidth = 100 * 0.5 = 50, middleWidth = 50 * 1.3 = 65.
function vmWithViewport(len, { width = 300, height = 100, readonly } = {}) {
  const vm = vmWith(len, readonly);
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
    it("maps a tile number to its first collection index", function () {
      const vm = vmWith(30);
      expect(vm.mapTileNumToCollection(0)).to.equal(2);
      expect(vm.mapTileNumToCollection(1)).to.equal(6);
      expect(vm.mapTileNumToCollection(5)).to.equal(22);
    });

    // A tile is a 2x2 grid filled column-major: visual cells [top-left,
    // top-right, bottom-left, bottom-right] map to collection offsets [0,2,1,3].
    it("lists a tile's 4 cells in column-major visual order", function () {
      const vm = vmWith(30);
      expect(vm.collectionIndicesForTile(0)).to.deep.equal([2, 4, 3, 5]);
      expect(vm.collectionIndicesForTile(1)).to.deep.equal([6, 8, 7, 9]);
    });
  });

  describe("geometry", function () {
    it("derives endcap and middle widths from the viewport height", function () {
      const vm = vmWithViewport(30);
      expect(vm.endcapWidth, "endcapWidth = height * 0.5").to.equal(50);
      expect(vm.middleWidth, "middleWidth = endcapWidth * 1.3").to.equal(65);
    });

    it("positions each tile after the endcap", function () {
      const vm = vmWithViewport(30);
      expect(vm.tileLeft(0)).to.equal(50);
      expect(vm.tileLeft(1)).to.equal(115);
      expect(vm.tileLeft(2)).to.equal(180);
      expect(vm.tileWidth).to.equal(66);
    });

    it("sums the tiles plus the endcap for the tray width", function () {
      expect(vmWithViewport(30).trayWidth, "8 tiles * 65 + 50").to.equal(570);
    });

    it("clamps the tray width up to the viewport width for a short tray", function () {
      expect(vmWithViewport(2).trayWidth, "1 tile * 65 + 50 = 115 < 300").to.equal(300);
    });

    it("exposes the tray width as a dip css string for binding", function () {
      expect(vmWithViewport(30).trayWidthCss).to.equal("570dp");
    });
  });

  describe("windowing", function () {
    it("maps a scroll offset to a tile index", function () {
      const vm = vmWithViewport(30);
      expect(vm.roundToTile(0), "before tile 0").to.equal(-1);
      expect(vm.roundToTile(50), "start of tile 0").to.equal(0);
      expect(vm.roundToTile(115), "start of tile 1").to.equal(1);
    });

    it("computes the left and right tile edges for a scroll offset", function () {
      const vm = vmWithViewport(30);
      expect(vm.visibleRange(0)).to.deep.equal({ leftEdge: -1, rightEdge: 4 });
      expect(vm.visibleRange(200)).to.deep.equal({ leftEdge: 2, rightEdge: 7 });
    });
  });

  describe("visibleTiles", function () {
    // visibleTiles is the windowed set of interior tile VMs the collection
    // binding reconciles. Replaces the spike's syncWindow/_materialized: the
    // binder's keyed diff (keyed on tileNum) does the add/update/release.
    it("materializes the tiles in the window [max(0,leftEdge)..rightEdge-1]", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      expect(vm.visibleTiles.map(t => t.tileNum)).to.deep.equal([0, 1, 2, 3]);
    });

    it("windows a scrolled offset without negative indices", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(200);
      expect(vm.visibleTiles.map(t => t.tileNum)).to.deep.equal([2, 3, 4, 5, 6]);
    });

    it("keys each tile on its tile number", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      expect(vm.visibleTiles.map(t => t.key)).to.deep.equal([0, 1, 2, 3]);
    });

    // Stable identity across frames so the keyed diff retains a tile that stays
    // on screen rather than churning it.
    it("returns the same tile VM instance for a tile that stays in the window", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      const tile2a = vm.visibleTiles.find(t => t.tileNum === 2);
      vm.setScrollOffset(200);
      const tile2b = vm.visibleTiles.find(t => t.tileNum === 2);
      expect(tile2b).to.equal(tile2a);
    });

    it("carries each tile's geometry for the component to bind", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      const tile1 = vm.visibleTiles.find(t => t.tileNum === 1);
      expect(tile1.left).to.equal(115);
      expect(tile1.width).to.equal(66);
      expect(tile1.backgroundImage).to.include("tiling_interior_320.png");
    });

    it("exposes geometry as dip css strings for Ti binding", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      const tile1 = vm.visibleTiles.find(t => t.tileNum === 1);
      expect(tile1.leftCss).to.equal("115dp");
      expect(tile1.widthCss).to.equal("66dp");
      expect(tile1.heightCss, "height = viewport height").to.equal("100dp");
      expect(tile1.taxa[0].widthCss, "half the middle width less 1: 65/2 - 1").to.equal("31.5dp");
    });
  });

  describe("endcapTiles", function () {
    // The endcap (first two taxa, not virtualized) is a permanent single-item
    // collection so the binder owns its lifecycle and the mvvm controller stays
    // Ti-free.
    it("is a single, always-present endcap VM keyed 'endcap'", function () {
      const vm = vmWithViewport(30);
      expect(vm.endcapTiles).to.have.lengthOf(1);
      expect(vm.endcapTiles[0].key).to.equal("endcap");
    });

    it("sits at the tray origin with the endcap background", function () {
      const vm = vmWithViewport(30);
      const endcap = vm.endcapTiles[0];
      expect(endcap.left).to.equal(0);
      expect(endcap.width).to.equal(50);
      expect(endcap.backgroundImage).to.include("endcap_320.png");
    });

    it("holds the first two collection cells", function () {
      const vm = vmWithViewport(30);
      expect(vm.endcapTiles[0].taxa).to.have.lengthOf(2);
    });
  });

  describe("cell kinds", function () {
    // Cell kinds mirror the old addTrayIcon/updateTrayIcon decision table.
    it("shows a taxon icon for a filled cell", function () {
      const cells = vmWithViewport(6).endcapTiles[0].taxa;
      expect(cells[0].kind).to.equal("taxon");
      expect(cells[0].image).to.include("/taxon_1.png");
    });

    it("shows the plus (add) cell at the first empty position", function () {
      const vm = vmWithViewport(2); // taxa fill the endcap; first tile cell 0 is empty
      const tile0 = (vm.setScrollOffset(0), vm.visibleTiles[0]);
      expect(tile0.taxa[0].kind, "cell at index === length is the plus").to.equal("plus");
      expect(tile0.taxa[0].image, "no silhouette on a plus cell").to.equal(null);
    });

    it("shows an add-behind (blank, tappable) cell past the plus", function () {
      const vm = vmWithViewport(2);
      const tile0 = (vm.setScrollOffset(0), vm.visibleTiles[0]);
      expect(tile0.taxa[1].kind, "cell past length is add-behind").to.equal("addBehind");
    });

    it("shows blank cells only (no plus / add-behind) in readonly mode", function () {
      const vm = vmWithViewport(2, { readonly: true });
      const tile0 = (vm.setScrollOffset(0), vm.visibleTiles[0]);
      expect(tile0.taxa.map(c => c.kind)).to.deep.equal(["blank", "blank", "blank", "blank"]);
    });

    it("orders a tile's cells column-major [base, base+2, base+1, base+3]", function () {
      const vm = vmWithViewport(10);
      const tile0 = (vm.setScrollOffset(0), vm.visibleTiles[0]);
      // tile 0 base = 2 → cells [2,4,3,5]; taxa 1..10 → all taxon
      expect(tile0.taxa.map(c => c.taxonId)).to.deep.equal([3, 5, 4, 6]);
    });

    it("keys each cell on its position for the taxa collection diff", function () {
      const cells = vmWithViewport(10).visibleTiles[0].taxa;
      expect(cells.map(c => c.key)).to.deep.equal([0, 1, 2, 3]);
    });
  });

  describe("SampleTaxaIconViewModel", function () {
    function cellOf(len, idx) {
      return vmWithViewport(len).endcapTiles[0].taxa[idx];
    }

    it("exposes the silhouette image", function () {
      expect(cellOf(6, 0).image).to.include("/taxon_1.png");
    });

    it("shows the abundance only for a taxon cell", function () {
      const taxon = cellOf(6, 0);
      expect(taxon.abundanceText).to.equal("1-2");
      expect(taxon.abundanceVisible).to.equal(true);
      expect(taxon.iconVisible).to.equal(true);
    });

    it("hides the icon and abundance and shows the plus on a plus cell", function () {
      const vm = vmWithViewport(2);
      const plus = (vm.setScrollOffset(0), vm.visibleTiles[0].taxa[0]);
      expect(plus.iconVisible).to.equal(false);
      expect(plus.abundanceVisible).to.equal(false);
      expect(plus.plusVisible).to.equal(true);
      expect(plus.plusImage, "the plus icon").to.include("plus-icon.png");
    });

    it("hides the plus on a taxon cell", function () {
      const taxon = cellOf(6, 0);
      expect(taxon.plusVisible).to.equal(false);
      expect(taxon.plusImage).to.equal(undefined);
    });

    it("composes an accessibility label from taxon id, name and abundance", function () {
      expect(cellOf(6, 0).accessibilityLabel).to.equal("Taxon 1, Species 1, abundance 1-2");
    });

    it("exposes the sample taxon id for the edit intent", function () {
      expect(cellOf(6, 0).sampleTaxonId).to.equal(1001);
    });
  });

  describe("cell tap intent", function () {
    it("fires IDENTIFY with the taxon ids and readonly flag when a taxon is tapped", function () {
      const topics = fakeTopics();
      const cell = vmWithTopics(6, topics).endcapTiles[0].taxa[0];
      cell.tap();
      expect(topics.fired).to.deep.equal([{
        event: "identify",
        data: { sampleTaxonId: 1001, taxonId: 1, readonly: false },
      }]);
    });

    it("fires SELECT_METHOD to add to the sample when a plus cell is tapped", function () {
      const topics = fakeTopics();
      const vm = vmWithTopics(2, topics);
      vm.setViewport({ width: 300, height: 100 });
      const plus = (vm.setScrollOffset(0), vm.visibleTiles[0].taxa[0]);
      plus.tap();
      expect(topics.fired).to.deep.equal([{
        event: "select_method",
        data: { allowAddToSample: true, surveyType: 3, unknownBug: true },
      }]);
    });

    it("fires SELECT_METHOD when an add-behind cell is tapped", function () {
      const topics = fakeTopics();
      const vm = vmWithTopics(2, topics);
      vm.setViewport({ width: 300, height: 100 });
      const addBehind = (vm.setScrollOffset(0), vm.visibleTiles[0].taxa[1]);
      addBehind.tap();
      expect(topics.fired[0].event).to.equal("select_method");
    });

    it("does nothing when a blank cell is tapped", function () {
      const topics = fakeTopics();
      const vm = vmWithTopics(2, topics, true); // readonly → all blank
      vm.setViewport({ width: 300, height: 100 });
      const blank = (vm.setScrollOffset(0), vm.visibleTiles[0].taxa[0]);
      blank.tap();
      expect(topics.fired).to.deep.equal([]);
    });
  });

  describe("notification", function () {
    it("notifies on setScrollOffset so the collection reconciles", function () {
      const vm = vmWithViewport(30);
      let notified = 0;
      vm.addListener(() => notified++);
      vm.setScrollOffset(200);
      expect(notified).to.equal(1);
    });

    it("notifies each materialized tile VM on a viewport change so geometry re-applies", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      const tile0 = vm.visibleTiles[0];
      let tileNotified = 0;
      tile0.addListener(() => tileNotified++);
      vm.setViewport({ width: 400, height: 120 });
      expect(tileNotified).to.equal(1);
      // geometry re-derives from the new viewport: endcapWidth = 120*0.5 = 60,
      // so tile 0 now sits at left = 0*middleWidth + endcapWidth = 60.
      expect(tile0.left).to.equal(60);
    });

    // Each cell binds its own widthCss, so a late viewport measurement must
    // cascade to the slots or they render at a stale width (the geometry-cascade
    // risk the plan flags).
    it("notifies each cell's slots on a viewport change so their width re-applies", function () {
      const vm = vmWithViewport(30);
      vm.setScrollOffset(0);
      const slot = vm.visibleTiles[0].taxa[0];
      let slotNotified = 0;
      slot.addListener(() => slotNotified++);
      vm.setViewport({ width: 400, height: 120 });
      expect(slotNotified).to.equal(1);
      // middleWidth = (120*0.5)*1.3 = 78 → cellWidth = 78/2 - 1 = 38.
      expect(slot.widthCss).to.equal("38dp");
    });

    it("ignores a viewport measurement with no height (view not laid out yet)", function () {
      const vm = vmWith(30);
      expect(vm.setViewport({ width: 300, height: 0 }), "reports the reading unusable").to.equal(false);
      expect(vm.viewWidth).to.equal(0);
    });
  });

  describe("refresh", function () {
    // The VM refreshes when the taxa collection changes (via source.onChange).
    it("re-derives cell kinds after taxa are added", function () {
      const taxa = taxaOf(2);
      const vm = new SampleTrayViewModel({ taxaSource: fakeTaxaSource(taxa) });
      vm.setViewport({ width: 300, height: 100 });
      vm.setScrollOffset(0);
      expect(vm.visibleTiles[0].taxa[0].kind).to.equal("plus");
      taxa.push(taxon(3, "3-5")); // now index 2 is filled
      vm.refresh();
      expect(vm.visibleTiles[0].taxa[0].kind).to.equal("taxon");
      expect(vm.visibleTiles[0].taxa[0].taxonId).to.equal(3);
    });

    it("updates a retained taxon cell in place on an abundance change (positional reuse)", function () {
      const taxa = taxaOf(6);
      const vm = new SampleTrayViewModel({ taxaSource: fakeTaxaSource(taxa) });
      vm.setViewport({ width: 300, height: 100 });
      const cell = vm.endcapTiles[0].taxa[0];
      taxa[0] = taxon(1, "6-10");
      vm.refresh();
      expect(vm.endcapTiles[0].taxa[0], "same slot VM instance").to.equal(cell);
      expect(cell.abundanceText).to.equal("6-10");
    });

    it("fires 'scrollToRightEnd' so the scroll command reveals the newest taxon", function () {
      const vm = vmWithViewport(6);
      let fired = 0;
      vm.on("scrollToRightEnd", () => fired++);
      vm.refresh();
      expect(fired).to.equal(1);
    });

    it("refreshes automatically when the source reports a change", function () {
      const taxa = taxaOf(2);
      let cb = null;
      const source = Object.assign(fakeTaxaSource(taxa), { onChange(fn) { cb = fn; } });
      const vm = new SampleTrayViewModel({ taxaSource: source });
      vm.setViewport({ width: 300, height: 100 });
      vm.setScrollOffset(0);
      expect(vm.visibleTiles[0].taxa[0].kind).to.equal("plus");
      taxa.push(taxon(3, "3-5"));
      cb(); // the collection fired add/change/remove
      expect(vm.visibleTiles[0].taxa[0].kind).to.equal("taxon");
    });
  });

  describe("scroll target", function () {
    it("reports the right-edge offset the scroll command animates to", function () {
      // trayWidth 570 - viewWidth 300 = 270 (toSystem defaults to identity).
      expect(vmWithViewport(30).scrollTargetX).to.equal(270);
    });
  });
});
