const ChangeNotifier = require("../util/ChangeNotifier");
const Logger = require("../util/Logger");

// Hold just below 100 until recordSuccess() owns the final 100%, so the
// bar never reports complete while work is still settling.
const PROGRESS_CAP = 99;

const INITIAL_STATE = {
  status: "idle",
  percent: 0,
  errorMessage: null,
  hasErrors: false,
};

class SyncStore extends ChangeNotifier {
  constructor() {
    super();
    this._state = { ...INITIAL_STATE };
    this._unsubscribeLogger = Logger.subscribe(
      { facility: "sync", minLevel: "error" },
      () => {
        if (this._state.status === "syncing") {
          this._setState({ hasErrors: true });
        }
      }
    );
  }

  get status()       { return this._state.status; }
  get percent()      { return this._state.percent; }
  get errorMessage() { return this._state.errorMessage; }
  get hasErrors()    { return this._state.hasErrors; }

  dispose() {
    if (this._unsubscribeLogger) this._unsubscribeLogger();
    super.dispose();
  }

  recordStart() {
    this._setState({ ...INITIAL_STATE, status: "syncing" });
  }

  recordProgress(progress) {
    if (this._state.status !== "syncing") return;
    if (progress && progress.total > 0) {
      this._setState({
        percent: Math.min(PROGRESS_CAP, Math.round((progress.current / progress.total) * 100))
      });
    }
  }

  recordSuccess() {
    this._setState({ status: "success", percent: 100 });
  }

  recordError(error) {
    const errorMessage = (error && error.message) || "";
    this._setState({ status: "error", errorMessage });
  }

  recordOffline() {
    this._setState({ status: "offline" });
  }

  _setState(patch) {
    this._state = { ...this._state, ...patch };
    this.notifyListeners();
  }
}

module.exports = SyncStore;
