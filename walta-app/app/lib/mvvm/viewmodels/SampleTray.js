const ChangeNotifier = require("../../util/ChangeNotifier");
const { endcapTile, interiorTile } = require("./SampleTrayTile");

const identity = (x) => x;

// The non-modal "some incorrect" assessment notice.
const NOTICE_TEXT =
  "One or more of the expected taxa are incorrect.\nPlease select incorrect identifications below for details.";
const NOTICE_DWELL_MS = 4000;   // how long it dwells before fading
const NOTICE_FADE_OUT_MS = 400; // must match the fadeOutNotice command's duration

// Titanium-free view-model for the ice-cube SampleTray. Owns all layout geometry
// (derived from the measured viewport in dip), the scroll windowing, and the
// per-cell content + intent — so the controller keeps no Titanium input wiring.
// The presenter hands it a clean viewport size (system px) and the scroll offset
// through bindView; the VM converts with the injected toDip/toSystem so it stays
// Node-testable. `taxaSource` is the injected SampleTraySource:
// { length(), at(i) -> plain per-taxon data, surveyType(), onChange(cb), readonly }.
// The tile + slot VMs (SampleTrayTile — endcap or interior — and its
// SampleTaxaIcon/SampleTrayPlus slots) read their geometry, kinds and intent
// payload back through the public accessors here.
class SampleTrayViewModel extends ChangeNotifier {
  constructor({ taxaSource, topics, toDip, toSystem, training, assessor, setTimer, clearTimer, noticeDwellMs }) {
    super();
    this._taxaSource = taxaSource;
    this._topics = topics;
    this._toDip = toDip || identity;
    this._toSystem = toSystem || identity;
    this._readonly = taxaSource.readonly === true;
    this._training = training === true;
    this._assessor = assessor;
    // Injected so the notice's dwell/fade is Node-testable without real waits.
    this._setTimer = setTimer || ((fn, ms) => setTimeout(fn, ms));
    this._clearTimer = clearTimer || ((id) => clearTimeout(id));
    this._noticeDwellMs = noticeDwellMs || NOTICE_DWELL_MS;
    this._noticeVisible = false;
    this._noticeTimers = [];
    this._verdicts = null; // null until assessed → blank tick/cross overlay
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._scrollx = 0;
    this._tileCache = new Map();
    this._endcapVm = endcapTile(this);
    this._visibleTiles = [];
    this._onSourceChange = () => this.refresh();
    if (typeof taxaSource.onChange === "function") taxaSource.onChange(this._onSourceChange);
    // In training the Assess intent arrives on the bus (fired by the anchor bar);
    // the VM owns the behaviour, so it grades itself when asked.
    this._onAssess = () => this.assess();
    if (this._training && topics && typeof topics.subscribe === "function") {
      topics.subscribe(topics.ASSESS, this._onAssess);
    }
  }

  // ── Accessors the cell + slot VMs read ────────────────────────────────────
  get topics() { return this._topics; }
  get readonly() { return this._readonly; }
  // A training session hides abundance and swaps Next for Assess; verdicts stay
  // blank until assess() runs.
  get trainingMode() { return this._training; }

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

  // ── Geometry (bit-for-bit with the old controller's getters) ──────────────

  // The presenter hands a clean, laid-out viewport size (system px) — the
  // Titanium measurement hack lives in measureView, not here. Convert to dip and
  // re-derive geometry.
  setViewport(size) {
    this._viewportWidth = this._toDip(size.width);
    this._viewportHeight = this._toDip(size.height);
    // Two-level cascade: cached cells re-apply their geometry (and their slots'),
    // then the screen re-applies trayWidth + re-windows, then asks Ti to reveal the
    // right edge.
    this._reapplyCells();
    this._recomputeWindow();
    this.notifyListeners();
    this.trigger("scrollToRightEnd");
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
    this._reapplyCells();
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
  // Visibility + text are bound (bindView); the fade is a bindView command
  // (fadeInNotice/fadeOutNotice → animate). The VM owns the dwell → fade-out →
  // hide lifecycle on injected timers, so the Alloy shell holds none of it.
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
    this._reapplyCells();
    this.notifyListeners();
  }

  _reapplyCells() {
    this._tileCache.forEach(t => t.reapply());
    this._endcapVm.reapply();
  }

  get viewWidth() { return this._viewportWidth; }
  get endcapHeight() { return this._viewportHeight; }
  get endcapWidth() { return this.endcapHeight * 0.5; }
  get middleWidth() { return this.endcapWidth * 1.3; }
  // Each cell fills half the tile's middle width (two columns), less 1dp.
  get cellWidth() { return this.middleWidth / 2 - 1; }

  get tileCount() {
    return Math.floor((this._taxaSource.length() - 2) / 4) + 1;
  }

  get trayWidth() {
    const width = this.tileCount * this.middleWidth + this.endcapWidth;
    return width < this.viewWidth ? this.viewWidth : width;
  }

  get trayWidthCss() { return `${this.trayWidth}dp`; }

  // The system-px offset the scroll command animates to — the far right edge.
  get scrollTargetX() { return this._toSystem(this.trayWidth - this.viewWidth); }

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
  get endcapVm() { return this._endcapVm; }
  get visibleTiles() { return this._visibleTiles; }

  // Titanium hands the raw scroll offset (system px) via an input() binding.
  setScrollOffset(px) {
    this._scrollx = this._toDip(px);
    this._recomputeWindow();
    this.notifyListeners();
  }

  // Re-derive cell content across every cached tile (a taxa add/change/remove),
  // then re-window and reveal the right edge. Positional icon reuse is preserved
  // inside each cell's slot VMs. A taxa change also drops any training feedback.
  refresh() {
    this._verdicts = null;
    this._tileCache.forEach(t => t.update());
    this._endcapVm.update();
    this._recomputeWindow();
    this.notifyListeners();
    this.trigger("scrollToRightEnd");
  }

  dispose() {
    this._clearNoticeTimers();
    if (typeof this._taxaSource.offChange === "function") {
      this._taxaSource.offChange(this._onSourceChange);
    }
    if (this._training && this._topics && typeof this._topics.unsubscribe === "function") {
      this._topics.unsubscribe(this._topics.ASSESS, this._onAssess);
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
      vm = interiorTile(this, n);
      this._tileCache.set(n, vm);
    }
    return vm;
  }

  // ── Cell content (mirrors the old addTrayIcon / updateTrayIcon table) ──────

  cellKind(collectionIndex) {
    const len = this._taxaSource.length();
    if (collectionIndex < len) {
      return this._taxaSource.at(collectionIndex) ? "taxon" : "blank";
    }
    if (collectionIndex === len) return this._readonly ? "blank" : "plus";
    return this._readonly ? "blank" : "addBehind";
  }

  cellData(collectionIndex) {
    return this._taxaSource.at(collectionIndex);
  }
}

module.exports = SampleTrayViewModel;
