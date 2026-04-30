const ChangeNotifier = require("../util/ChangeNotifier");
const Logger = require("../util/Logger");

const PROGRESS_COLOR_NORMAL = "#26849c";
const PROGRESS_COLOR_ERROR = "#c0392b";

const OFFLINE_MESSAGE = "The mobile network is unavailable right now, the sample upload will be queued and retried in the background when the network becomes available again. Alternatively return to the Sync screen at any time to manually synchronise.";

class SyncFeedbackViewModel extends ChangeNotifier {
  constructor({ syncController }) {
    super();
    this._syncController = syncController;
    this._logVisible = false;
    this._onSyncChange = () => this.notifyListeners();
    syncController.addListener(this._onSyncChange);
  }

  get status()       { return this._syncController.status; }
  get percent()      { return this._syncController.percent; }
  get statusText()   { return this._syncController.statusText; }
  // Sourced from Logger's in-memory ring buffer, not the syncController
  // — sync progress messages are already on screen as statusText. The
  // Show Logs pane shows finer-grained Logger.log/warn/error output.
  // See WB-45.
  get logLines()     { return Logger.getLogLines(); }
  get errorMessage() { return this._syncController.errorMessage; }
  get logVisible() { return this._logVisible; }

  get message() {
    return this.status === "offline" ? OFFLINE_MESSAGE : "";
  }

  get messageVisible() {
    return this.message !== "";
  }

  get progressColor() {
    return this.status === "error" ? PROGRESS_COLOR_ERROR : PROGRESS_COLOR_NORMAL;
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
    return this.logLines.join("\n");
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
    super.dispose();
  }
}

module.exports = SyncFeedbackViewModel;
