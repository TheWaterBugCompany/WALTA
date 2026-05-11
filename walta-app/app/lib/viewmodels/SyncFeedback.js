const ChangeNotifier = require("../util/ChangeNotifier");
const Logger = require("../util/Logger");
const Palette = require("../util/Palette");

const OFFLINE_MESSAGE = "The mobile network is unavailable right now, the sample upload will be queued and retried in the background when the network becomes available again. Alternatively return to the Sync screen at any time to manually synchronise.";

// Show Logs pane filter — only the curated info-level milestones from
// the sync facility (start/end markers, key download done, etc.).
// See docs/patterns/logger-sinks.md.
const LOG_FILTER = { facility: "sync", minLevel: "info" };
const LOG_LIMIT = 5000;

class SyncFeedbackViewModel extends ChangeNotifier {
  constructor({ syncController, logRepository }) {
    super();
    this._syncController = syncController;
    this._logRepository = logRepository;
    this._logVisible = false;
    this._onSyncChange = () => this.notifyListeners();
    syncController.addListener(this._onSyncChange);

    // Cross-run history: query persisted entries newest-first, then
    // reverse for display so the pane reads top-to-bottom chronologically
    // (oldest → newest), tail-style.
    const recent = logRepository.query({ ...LOG_FILTER, limit: LOG_LIMIT });
    recent.reverse();
    this._logEntries = recent;
    // Monotonic append counter — used by views to detect new entries
    // even when the buffer is at LOG_LIMIT (length stops changing once
    // every push is matched by a shift).
    this._logSeq = 0;

    // Live updates: subscribe directly to Logger, independent of any
    // sink. New matching entries get appended to the end (newest-last).
    this._unsubscribeLogger = Logger.subscribe(LOG_FILTER, (entry) => {
      this._logEntries.push(entry);
      if (this._logEntries.length > LOG_LIMIT) this._logEntries.shift();
      this._logSeq++;
      this.notifyListeners();
    });
  }

  get status()       { return this._syncController.status; }
  get percent()      { return this._syncController.percent; }
  get statusText()   { return this._syncController.statusText; }
  get logLines()     { return this._logEntries; }
  get logSeq()       { return this._logSeq; }
  get errorMessage() { return this._syncController.errorMessage; }
  get logVisible()   { return this._logVisible; }

  get message() {
    return this.status === "offline" ? OFFLINE_MESSAGE : "";
  }

  get messageVisible() {
    return this.message !== "";
  }

  get progressColor() {
    return (this.status === "error" || this._syncController.hasErrors) ? Palette.error : Palette.primary;
  }

  get progressWidth() {
    return this.percent + "%";
  }

  get progressText() {
    if (this.status === "offline") return "0%";
    if (this.status === "error") return this.percent + "% " + (this.errorMessage || "Server Error");
    if (this.statusText) return this.percent + "% " + this.statusText;
    return this.percent + "%";
  }

  get diagnosticsVisible() {
    return this._logVisible;
  }

  get logToggleLabel() {
    return this._logVisible ? "Hide Logs" : "Show Logs";
  }

  get logText() {
    return this._logEntries.map(e => e.message).join("\n");
  }

  get logPaneHeight() {
    return this._logVisible ? "180dp" : "0dp";
  }

  start() {
    this._syncController.forceUpload();
  }

  toggleLog() {
    this._logVisible = !this._logVisible;
    this.notifyListeners();
  }

  close() {
    this.trigger("close");
  }

  openDiagnostics() {
    this.trigger("diagnostics");
  }

  dispose() {
    this._syncController.removeListener(this._onSyncChange);
    if (this._unsubscribeLogger) this._unsubscribeLogger();
    super.dispose();
  }
}

module.exports = SyncFeedbackViewModel;
