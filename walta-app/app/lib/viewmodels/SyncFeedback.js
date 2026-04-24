const ChangeNotifier = require("../util/ChangeNotifier");

const PROGRESS_COLOR_NORMAL = "#26849c";
const PROGRESS_COLOR_ERROR = "#c0392b";

const OFFLINE_MESSAGE = "The mobile network is unavailable right now, the sample upload will be queued and retried in the background when the network becomes available again. Alternatively return to the Sync screen at any time to manually synchronise.";

class SyncFeedbackViewModel extends ChangeNotifier {
  constructor({ syncController }) {
    super();
    this._syncController = syncController;
    this._logVisible = false;
    this._eventListeners = {};
    this._onSyncChange = () => this.notifyListeners();
    syncController.addListener(this._onSyncChange);
  }

  get status() { return this._syncController.getState().status; }
  get percent() { return this._syncController.getState().percent; }
  get statusText() { return this._syncController.getState().statusText; }
  get logLines() { return this._syncController.getState().logLines; }
  get errorMessage() { return this._syncController.getState().errorMessage; }
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
    return this._logVisible ? "Hide Logs" : "Show Log";
  }

  get logText() {
    return this.logLines.join("\n");
  }

  start() {
    this._syncController.forceUpload();
  }

  toggleLog() {
    this._logVisible = !this._logVisible;
    this.notifyListeners();
  }

  close() {
    this._emit("close");
  }

  openDiagnostics() {
    this._emit("diagnostics");
  }

  on(event, cb) {
    (this._eventListeners[event] = this._eventListeners[event] || []).push(cb);
  }

  dispose() {
    this._syncController.removeListener(this._onSyncChange);
    this._eventListeners = {};
    super.dispose();
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => cb(data));
  }
}

module.exports = SyncFeedbackViewModel;
