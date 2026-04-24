// SPIKE: SyncFeedback VM as an Alloy Model, so the view can bind
// attributes declaratively in XML (`{syncFeedback.progressColor}`).
// No SQL persistence — the "properties" adapter is the lightest
// in-memory adapter Alloy ships.
//
// `initialize(attrs, options)` accepts an injected `syncController`
// so Node unit tests can pass a fake; production XML instantiation
// falls back to the shipped `SampleSync` singleton.

var PROGRESS_COLOR_NORMAL = "#26849c";
var PROGRESS_COLOR_ERROR = "#c0392b";

var OFFLINE_MESSAGE = "The mobile network is unavailable right now, the sample upload will be queued and retried in the background when the network becomes available again. Alternatively return to the Sync screen at any time to manually synchronise.";

exports.definition = {
    config: {
        columns: {},
        adapter: {
            type: "properties",
            collection_name: "syncFeedback"
        }
    },

    extendModel: function (Model) {
        Object.assign(Model.prototype, {

            initialize: function (attrs, options) {
                this._syncController = (options && options.syncController) || require("logic/SampleSync");
                this.set({
                    logVisible: false,
                    status: "idle",
                    percent: 0,
                    statusText: "",
                    logLines: [],
                    errorMessage: null,
                });
                this._onSyncChange = this._projectStoreState.bind(this);
                this._syncController.addListener(this._onSyncChange);
                this._projectStoreState();
                this.on("change:status change:percent change:statusText change:errorMessage change:logLines change:logVisible", this._recomputeDerived, this);
            },

            // --- actions ------------------------------------------------

            start: function () {
                this._syncController.forceUpload();
            },

            toggleLog: function () {
                this.set("logVisible", !this.get("logVisible"));
            },

            close: function () {
                this.trigger("close");
            },

            openDiagnostics: function () {
                this.trigger("diagnostics");
            },

            dispose: function () {
                this._syncController.removeListener(this._onSyncChange);
                this.off();
            },

            // --- derive attrs from store + logVisible -------------------

            _projectStoreState: function () {
                var base = this._syncController.getState();
                this.set({
                    status: base.status,
                    percent: base.percent,
                    statusText: base.statusText,
                    logLines: base.logLines,
                    errorMessage: base.errorMessage,
                });
                this._recomputeDerived();
            },

            _recomputeDerived: function () {
                var status = this.get("status");
                var percent = this.get("percent");
                var statusText = this.get("statusText");
                var errorMessage = this.get("errorMessage");
                var logLines = this.get("logLines") || [];
                var logVisible = this.get("logVisible");

                var isOffline = status === "offline";
                var isError = status === "error";

                var progressText;
                if (isOffline) progressText = "0%";
                else if (isError) progressText = percent + "% " + (errorMessage || "Server Error");
                else if (statusText) progressText = percent + "% " + statusText;
                else progressText = percent + "%";

                this.set({
                    message: isOffline ? OFFLINE_MESSAGE : "",
                    messageVisible: isOffline,
                    progressColor: isError ? PROGRESS_COLOR_ERROR : PROGRESS_COLOR_NORMAL,
                    progressWidth: percent + "%",
                    progressText: progressText,
                    diagnosticsVisible: !!logVisible,
                    logToggleLabel: logVisible ? "Hide Logs" : "Show Log",
                    logText: logLines.join("\n"),
                });
            }
        });

        return Model;
    },

    extendCollection: function (Collection) { return Collection; }
};
