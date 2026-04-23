const TOPICS = {
  FORCE_UPLOAD: "forceupload",
  UPLOAD_PROGRESS: "uploadprogress",
  SYNC_STARTED: "syncstarted",
  SYNC_FINISHED: "syncfinished",
};

const PROGRESS_STEP = 15;
const PROGRESS_CAP = 95;

class SyncFeedbackViewModel {
  constructor({ topics, network }) {
    this._topics = topics;
    this._network = network;
    this._stateListeners = [];
    this._eventListeners = {};
    this.state = this._initialState();

    this._onStarted = () => this._handleSyncStarted();
    this._onProgress = data => this._handleUploadProgress(data);
    this._onFinished = data => this._handleSyncFinished(data);
    topics.subscribe(TOPICS.SYNC_STARTED, this._onStarted);
    topics.subscribe(TOPICS.UPLOAD_PROGRESS, this._onProgress);
    topics.subscribe(TOPICS.SYNC_FINISHED, this._onFinished);
  }

  start() {
    if (!this._network.isOnline()) {
      this._setState({ status: "offline" });
      return;
    }
    this._topics.fireTopicEvent(TOPICS.FORCE_UPLOAD);
  }

  toggleLog() {
    this._setState({ logVisible: !this.state.logVisible });
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
    this._topics.unsubscribe(TOPICS.SYNC_STARTED, this._onStarted);
    this._topics.unsubscribe(TOPICS.UPLOAD_PROGRESS, this._onProgress);
    this._topics.unsubscribe(TOPICS.SYNC_FINISHED, this._onFinished);
    this._stateListeners = [];
    this._eventListeners = {};
  }

  _handleSyncStarted() {
    this._setState({
      status: "syncing",
      percent: 0,
      statusText: "",
      logLines: [],
      errorMessage: null,
    });
  }

  _handleUploadProgress(data) {
    if (this.state.status !== "syncing") return;
    const message = (data && data.message) || "";
    const nextPercent = Math.min(PROGRESS_CAP, this.state.percent + PROGRESS_STEP);
    this._setState({
      percent: nextPercent,
      statusText: message,
      logLines: message ? this.state.logLines.concat([message]) : this.state.logLines,
    });
  }

  _handleSyncFinished(data) {
    if (data && data.success) {
      this._setState({ status: "success", percent: 100, statusText: "Sync complete" });
    } else {
      const errorMessage = data && data.error && data.error.message ? data.error.message : "";
      this._setState({ status: "error", errorMessage });
    }
  }

  _initialState() {
    return {
      status: "idle",
      percent: 0,
      statusText: "",
      logVisible: false,
      logLines: [],
      errorMessage: null,
    };
  }

  _setState(patch) {
    this.state = Object.assign({}, this.state, patch);
    this._stateListeners.forEach(cb => cb(this.state));
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => cb(data));
  }
}

module.exports = SyncFeedbackViewModel;
