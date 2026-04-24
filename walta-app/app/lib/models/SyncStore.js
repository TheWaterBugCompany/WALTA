const ChangeNotifier = require("../util/ChangeNotifier");

const PROGRESS_STEP = 15;
const PROGRESS_CAP = 95;
const LOG_CAP = 200;

const INITIAL_STATE = {
  status: "idle",
  percent: 0,
  statusText: "",
  logLines: [],
  errorMessage: null,
};

class SyncStore extends ChangeNotifier {
  constructor() {
    super();
    this._state = { ...INITIAL_STATE };
  }

  get status()       { return this._state.status; }
  get percent()      { return this._state.percent; }
  get statusText()   { return this._state.statusText; }
  get logLines()     { return this._state.logLines; }
  get errorMessage() { return this._state.errorMessage; }

  recordStart() {
    this._setState({ ...INITIAL_STATE, status: "syncing" });
  }

  recordProgress(message) {
    if (this._state.status !== "syncing") return;
    const safe = message || "";
    const nextPercent = Math.min(PROGRESS_CAP, this._state.percent + PROGRESS_STEP);
    const nextLog = safe ? this._appendLog(safe) : this._state.logLines;
    this._setState({ percent: nextPercent, statusText: safe, logLines: nextLog });
  }

  recordSuccess() {
    this._setState({ status: "success", percent: 100, statusText: "Sync complete" });
  }

  recordError(error) {
    const errorMessage = (error && error.message) || "";
    this._setState({ status: "error", errorMessage });
  }

  recordOffline() {
    this._setState({ status: "offline" });
  }

  _appendLog(line) {
    const next = this._state.logLines.concat([line]);
    return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
  }

  _setState(patch) {
    this._state = { ...this._state, ...patch };
    this.notifyListeners();
  }
}

module.exports = SyncStore;
