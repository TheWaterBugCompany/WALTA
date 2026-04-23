class SyncFeedbackViewModel {
  constructor({ syncController }) {
    this._syncController = syncController;
    this._logVisible = false;
    this._stateListeners = [];
    this._eventListeners = {};
    this._unsubSync = syncController.subscribe(() => this._notify());
  }

  get state() {
    return Object.assign({ logVisible: this._logVisible }, this._syncController.getState());
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
