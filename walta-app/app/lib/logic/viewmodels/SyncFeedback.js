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

  get state() {
    const base = this._syncController.getState();
    return Object.assign({}, base, {
      logVisible: this._logVisible,
      progressColor: this._progressColor(base),
      progressText: this._progressText(base),
    });
  }

  _progressColor(base) {
    return base.status === "error" ? PROGRESS_COLOR_ERROR : PROGRESS_COLOR_NORMAL;
  }

  _progressText(base) {
    if (base.status === "offline") return "0%";
    if (base.status === "error") return base.percent + "% " + (base.errorMessage || "Server Error");
    if (base.statusText) return base.percent + "% " + base.statusText;
    return base.percent + "%";
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
    this._stateListeners.forEach(cb => cb(this.state));
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => cb(data));
  }
}

module.exports = SyncFeedbackViewModel;
