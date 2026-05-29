// Shared fake for the SampleSync interface the SyncFeedback VM/controller
// observe. Exposes the live SyncStore so a spec can drive state via
// store.recordStart() / recordProgress() / recordError() etc., plus a
// counter for forceSync() calls.
//
// Pure JS (no Ti refs) so it works in both on-device specs
// (spec/fixtures/SyncController_fixture) and Node specs
// (../../walta-app/app/spec/fixtures/SyncController_fixture).

function createSyncController(SyncStore) {
    var store = new SyncStore();
    var forceSyncCalls = 0;
    var syncController = {
        get status()       { return store.status; },
        get percent()      { return store.percent; },
        get statusText()   { return store.statusText; },
        get errorMessage() { return store.errorMessage; },
        get hasErrors()    { return store.hasErrors; },
        addListener:    function (cb) { store.addListener(cb); },
        removeListener: function (cb) { store.removeListener(cb); },
        forceSync:      function ()   { forceSyncCalls++; },
    };
    return {
        syncController: syncController,
        store: store,
        forceSyncCalls: function () { return forceSyncCalls; },
    };
}

module.exports = createSyncController;
