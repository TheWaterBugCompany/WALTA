const PROGRESS_COLOR_NORMAL = "#26849c";
const PROGRESS_COLOR_ERROR = "#c0392b";

class SyncFeedbackViewModel {
  constructor({ syncController }) {
    this._syncController = syncController;
    this._logVisible = false;
    this._stateListeners = [];
    this._eventListeners = {};
    this._unsubSync = syncController.subscribe(() => this._notify());
  }

  get status() { return this._syncController.getState().status; }
  get percent() { return this._syncController.getState().percent; }
  get statusText() { return this._syncController.getState().statusText; }
  get logLines() { return this._syncController.getState().logLines; }
  get errorMessage() { return this._syncController.getState().errorMessage; }
  get logVisible() { return this._logVisible; }

  get offlineMessageVisible() {
    return this.status === "offline";
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
    this._notify();
  }

  close() {
    this._emit("close");
  }

  openDiagnostics() {
    this._emit("diagnostics");
  }

  subscribe(cb) {
    this._stateListeners.push(cb);
    return () => {
      this._stateListeners = this._stateListeners.filter(l => l !== cb);
    };
  }

  on(event, cb) {
    (this._eventListeners[event] = this._eventListeners[event] || []).push(cb);
  }

  dispose() {
    if (this._unsubSync) this._unsubSync();
    this._stateListeners = [];
    this._eventListeners = {};
  }

  _notify() {
    this._stateListeners.forEach(cb => cb());
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => cb(data));
  }
}

module.exports = SyncFeedbackViewModel;
