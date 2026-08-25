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
    this._readonly = taxaSource.readonly === true;
    this._tray = new IceCubeTrayViewModel({ taxaSource, toDip: this._toDip, toSystem: this._toSystem, owner: this });
    this._tray.addListener(() => this.notifyListeners());
    this._tray.on("scrollToRightEnd", () => this.trigger("scrollToRightEnd"));
    this._tray.on("iceCubeTrayCellSelected", (idx) => this._onCellSelected(idx));
  }

  // ── Accessors the cell + slot VMs read ────────────────────────────────────
  get topics() { return this._topics; }
  get readonly() { return this._readonly; }

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

  get cellCount() { return this._tray.cellCount; }

  cellKind(collectionIndex) {
    const len = this._taxaSource.length();
    if (collectionIndex < len) {
      return this._taxaSource.at(collectionIndex) ? "taxon" : "blank";
    }
    if (collectionIndex === len) return this._readonly ? "blank" : "plus";
    return this._readonly ? "blank" : "addBehind";
  }

  cellData(collectionIndex) { return this._tray.cellData(collectionIndex); }


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
