const ChangeNotifier = require("../../util/ChangeNotifier");
const IceCubeTrayViewModel = require("./IceCubeTray");

const identity = (x) => x;

// The non-modal "some incorrect" assessment notice.
const NOTICE_TEXT =
  "One or more of the expected taxa are incorrect.\nPlease select incorrect identifications below for details.";
const NOTICE_DWELL_MS = 4000;   // how long it dwells before fading
const NOTICE_FADE_OUT_MS = 400; // must match the fadeOutNotice command's duration

class TrainingTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource, topics, toDip, toSystem, assessor, setTimer, clearTimer, noticeDwellMs }) {
    super();
    this._taxaSource = taxaSource;
    this._topics = topics;
    this._toDip = toDip || identity;
    this._toSystem = toSystem || identity;
    this._tray = new IceCubeTrayViewModel({ taxaSource, toDip: this._toDip, toSystem: this._toSystem, owner: this });
    // Relay the engine's own broadcasts — bindView watches this VM, not the
    // composed engine, so its state-change/command events have to pass through.
    this._tray.addListener(() => this.notifyListeners());
    this._tray.on("scrollToRightEnd", () => this.trigger("scrollToRightEnd"));
    // A taxa add/change/remove drops any training feedback (an edit re-opens
    // the key) — must clear *before* the engine's tile/slot cells re-derive
    // and re-read verdictFor via their own notifyListeners cascade below.
    this._tray.on("refreshing", () => { this._verdicts = null; });
    this._tray.on("iceCubeTrayCellSelected", (idx) => this._onCellSelected(idx));
    this._assessor = assessor;
    // Injected so the notice's dwell/fade is Node-testable without real waits.
    this._setTimer = setTimer || ((fn, ms) => setTimeout(fn, ms));
    this._clearTimer = clearTimer || ((id) => clearTimeout(id));
    this._noticeDwellMs = noticeDwellMs || NOTICE_DWELL_MS;
    this._noticeVisible = false;
    this._noticeTimers = [];
    this._verdicts = null; // null until assessed → blank tick/cross overlay
    this._onAssess = () => this.assess();
    if (topics && typeof topics.subscribe === "function") {
      topics.subscribe(topics.ASSESS, this._onAssess);
    }
  }

  // ── Accessors the cell + slot VMs read ────────────────────────────────────
  get topics() { return this._topics; }
  get readonly() { return this._tray.readonly; }

  // The training verdict for a taxon, keyed by sampleTaxonId — filled by the
  // assessor on assess(). Blank (null) until then, so a taxon renders no
  // tick/cross overlay.
  verdictFor(sampleTaxonId) {
    if (!this._verdicts || sampleTaxonId == null) return null;
    const verdict = this._verdicts[sampleTaxonId];
    return verdict == null ? null : verdict;
  }
  surveyType() {
    return typeof this._taxaSource.surveyType === "function"
      ? this._taxaSource.surveyType()
      : null;
  }

  // ── Geometry — delegated to the composed IceCubeTrayViewModel ─────────────

  setViewport(size) {
    this._tray.setViewport(size);
  }

  // ── Training assessment ────────────────────────────────────────────────────

  // Run the injected assessor over the current taxa and reveal the verdicts. The
  // cell re-application makes each slot re-read verdictFor so the overlays appear.
  assess() {
    const taxa = [];
    for (let i = 0; i < this._taxaSource.length(); i++) {
      taxa.push(this._taxaSource.at(i));
    }
    this._verdicts = this._assessor.assess(taxa);
    this._tray.reapplyCells();
    this.notifyListeners();
    // A clean run — every graded taxon correct — is the training goal; announce it
    // so the screen can open the success modal. Otherwise, if any taxon is wrong,
    // announce that so the screen can surface the "some incorrect" notice.
    const verdicts = Object.keys(this._verdicts).map(k => this._verdicts[k]);
    const correct = verdicts.filter(v => v === "correct").length;
    if (verdicts.length > 0 && correct === verdicts.length) {
      this.trigger("allCorrect", correct);
    } else if (verdicts.some(v => v === "incorrect")) {
      this._showIncorrectNotice();
    }
  }

  // ── "Some incorrect" notice ─────────────────────────────────────────────────
  get noticeVisible() { return this._noticeVisible; }
  get noticeText() { return NOTICE_TEXT; }

  _showIncorrectNotice() {
    this._clearNoticeTimers();
    this._noticeVisible = true;
    this.notifyListeners();
    this.trigger("fadeInNotice");
    this._noticeTimers.push(this._setTimer(() => {
      this.trigger("fadeOutNotice");
      this._noticeTimers.push(this._setTimer(() => {
        this._noticeVisible = false;
        this.notifyListeners();
      }, NOTICE_FADE_OUT_MS));
    }, this._noticeDwellMs));
  }

  _clearNoticeTimers() {
    this._noticeTimers.forEach((t) => this._clearTimer(t));
    this._noticeTimers = [];
  }

  // Drop the feedback (a taxa edit re-opens the key), re-rendering blank overlays.
  clearAssessment() {
    if (!this._verdicts) return;
    this._verdicts = null;
    this._tray.reapplyCells();
    this.notifyListeners();
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

  setScrollOffset(px) {
    this._tray.setScrollOffset(px);
  }

  refresh() {
    this._tray.refresh();
  }

  dispose() {
    this._clearNoticeTimers();
    this._tray.dispose();
    if (this._topics && typeof this._topics.unsubscribe === "function") {
      this._topics.unsubscribe(this._topics.ASSESS, this._onAssess);
    }
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
        training: true,
      });
      return;
    }
    this._topics.fireTopicEvent(this._topics.SELECT_METHOD, {
      allowAddToSample: true,
      surveyType: this.surveyType(),
      unknownBug: true,
      training: true,
    });
  }
}

module.exports = TrainingTrayViewModel;
