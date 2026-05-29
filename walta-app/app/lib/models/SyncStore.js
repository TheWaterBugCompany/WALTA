const ChangeNotifier = require("../util/ChangeNotifier");
const Logger = require("../util/Logger");

// Hold just below 100 until recordSuccess() owns the final 100%, so the
// bar never reports complete while work is still settling.
const PROGRESS_CAP = 99;

const INITIAL_STATE = {
  status: "idle",
  percent: 0,
  statusText: "",
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
  get statusText()   { return this._state.statusText; }
  get errorMessage() { return this._state.errorMessage; }
  get hasErrors()    { return this._state.hasErrors; }

  dispose() {
    if (this._unsubscribeLogger) this._unsubscribeLogger();
    super.dispose();
  }

  recordStart() {
    this._setState({ ...INITIAL_STATE, status: "syncing" });
  }

  recordProgress(message, progress) {
    if (this._state.status !== "syncing") return;
    const patch = {};
    // Terse user-visible step name from the publisher (UPLOAD_PROGRESS).
    // Omit `message` entirely (percent-only tick) to advance the bar
    // without disturbing the headline currently shown.
    if (message !== undefined) patch.statusText = message || "";
    if (progress && progress.total > 0) {
      patch.percent = Math.min(PROGRESS_CAP, Math.round((progress.current / progress.total) * 100));
    }
    this._setState(patch);
  }

  recordSuccess() {
    this._setState({ status: "success", percent: 100, statusText: "" });
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
