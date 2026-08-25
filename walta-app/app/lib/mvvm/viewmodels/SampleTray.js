const ChangeNotifier = require("../../util/ChangeNotifier");
const IceCubeTrayViewModel = require("./IceCubeTray");

const identity = (x) => x;

class SampleTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource, topics, toDip, toSystem }) {
    super();
    this._taxaSource = taxaSource;
    this._topics = topics;
    this._toDip = toDip || identity;
    this._toSystem = toSystem || identity;
    this._tray = new IceCubeTrayViewModel({ taxaSource, toDip: this._toDip, toSystem: this._toSystem, owner: this });
    this._tray.addListener(() => this.notifyListeners());
    this._tray.on("scrollToRightEnd", () => this.trigger("scrollToRightEnd"));
    // A cell tap reports through the engine as a neutral "this collection
    // index was selected" — this VM decides what that means (IDENTIFY vs
    // SELECT_METHOD), not the tile/slot components.
    this._tray.on("iceCubeTrayCellSelected", (idx) => this._onCellSelected(idx));
  }

  // ── Accessors the cell + slot VMs read ────────────────────────────────────
  get topics() { return this._topics; }
  get readonly() { return this._tray.readonly; }

  surveyType() {
    return typeof this._taxaSource.surveyType === "function"
      ? this._taxaSource.surveyType()
      : null;
  }

  // ── Geometry — delegated to the composed IceCubeTrayViewModel ─────────────

  // The presenter hands a clean, laid-out viewport size (system px); the
  // engine converts to dip and re-derives geometry. The relay set up in the
  // constructor forwards its notifyListeners/scrollToRightEnd.
  setViewport(size) {
    this._tray.setViewport(size);
  }

  get viewWidth() { return this._tray.viewWidth; }
  get endcapHeight() { return this._tray.endcapHeight; }
  get endcapWidth() { return this._tray.endcapWidth; }
  get middleWidth() { return this._tray.middleWidth; }
  get cellWidth() { return this._tray.cellWidth; }
  get tileCount() { return this._tray.tileCount; }
  get trayWidth() { return this._tray.trayWidth; }
  get trayWidthCss() { return this._tray.trayWidthCss; }
  get scrollTargetX() { return this._tray.scrollTargetX; }
  tileLeft(n) { return this._tray.tileLeft(n); }
  get tileWidth() { return this._tray.tileWidth; }
  mapTileNumToCollection(n) { return this._tray.mapTileNumToCollection(n); }
  collectionIndicesForTile(n) { return this._tray.collectionIndicesForTile(n); }
  roundToTile(x) { return this._tray.roundToTile(x); }
  visibleRange(scrollx) { return this._tray.visibleRange(scrollx); }

  get endcapVm() { return this._tray.endcapVm; }
  get visibleTiles() { return this._tray.visibleTiles; }

  // Titanium hands the raw scroll offset (system px) via an input() binding.
  // The relay forwards the engine's notifyListeners.
  setScrollOffset(px) {
    this._tray.setScrollOffset(px);
  }

  // Re-derive cell content across every cached tile (a taxa add/change/remove),
  // then re-window and reveal the right edge. The relay forwards
  // notifyListeners/scrollToRightEnd.
  refresh() {
    this._tray.refresh();
  }

  dispose() {
    this._tray.dispose();
    super.dispose();
  }

  // ── Cell content (mirrors the old addTrayIcon / updateTrayIcon table) ──────

  cellKind(collectionIndex) { return this._tray.cellKind(collectionIndex); }
  cellData(collectionIndex) { return this._tray.cellData(collectionIndex); }

  // ── Cell selection — the slot components report a tap here; this VM decides
  // what it means ──────────────────────────────────────────────────────────

  selectCell(collectionIndex) { this._tray.selectCell(collectionIndex); }

  _onCellSelected(collectionIndex) {
    if (this.cellKind(collectionIndex) === "taxon") {
      const data = this.cellData(collectionIndex);
      this._topics.fireTopicEvent(this._topics.IDENTIFY, {
        sampleTaxonId: data.sampleTaxonId,
        taxonId: data.taxonId,
        readonly: this.readonly,
        position: collectionIndex,
        training: false,
      });
      return;
    }
    this._topics.fireTopicEvent(this._topics.SELECT_METHOD, {
      allowAddToSample: true,
      surveyType: this.surveyType(),
      unknownBug: true,
      training: false,
    });
  }
}

module.exports = SampleTrayViewModel;
