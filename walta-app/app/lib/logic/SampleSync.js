var Logger = require('util/Logger');
var Topics = require('ui/Topics');
var SyncStore = require('models/SyncStore');

var { createSampleUploader } = require("logic/SampleUploader");
var { createSampleDownloader } = require("logic/SampleDownloader");

var SYNC_INTERVAL = 1000*60*30; // 30 minutes
var isSyncing = false;
var cancelled = false;
var syncStore = new SyncStore();

const CANCELLED_MARKER = "__sync_cancelled__";

function areWeSyncing() {
    return isSyncing;
}

function addListener(cb) {
    syncStore.addListener(cb);
}

function removeListener(cb) {
    syncStore.removeListener(cb);
}

// Expose the store's read-side getters on the module so consumers
// that treat SampleSync as a syncController can read `.status`,
// `.percent`, etc. directly — same shape as SyncStore itself.
["status", "percent", "statusText", "logLines", "errorMessage", "hasErrors"].forEach(function (attr) {
    Object.defineProperty(exports, attr, { get: function () { return syncStore[attr]; }, enumerable: true });
});

var log = (m, tag = "sync") => Logger.log(m, tag);
var debug = (m, tag = "sync") => Logger.debug(m, tag);
var info = (m, tag = "sync") => Logger.info(m, tag);
var error = (m, tag = "sync") => Logger.error(m, tag);

let timeoutHandler = null;

function networkChanged( e ) {
    if ( e.networkType === Ti.Network.NETWORK_NONE ) {
        // don't bother trying to upload (saves battery)
        info("Lost network connection, sleeping.");
        clearUploadTimer();
    } else {
        info("Network connection up.");
        startSynchronise();
    }
}

function clearUploadTimer() {
    if ( timeoutHandler ) {
        clearTimeout( timeoutHandler );
        timeoutHandler = null;
    }
}

function handleUploadProgress(data) {
    syncStore.recordProgress(data && data.message);
}

function init() {
    log("Initialising SampleSync...");
    Ti.Network.addEventListener( "change", networkChanged );
    Topics.subscribe( Topics.LOGGEDIN, startSynchronise );
    Topics.subscribe( Topics.LOGGEDOUT, onLoggedOut );
    Topics.subscribe( Topics.UPLOAD_PROGRESS, handleUploadProgress );
    // Only sync eagerly if we already have a session; otherwise wait for the
    // LOGGEDIN event. Starting unconditionally raced a not-yet-established (or
    // about-to-be-cleared) login and caused "Not logged in" mid-sync (WB-103).
    if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
        startSynchronise();
    }
}

function onLoggedOut() {
    info("Logged out — cancelling any in-flight sync and stopping the schedule.");
    cancelled = true;
    clearUploadTimer();
}

function forceUpload(options) {
    clearUploadTimer();
    return startSynchronise(options);
}

function startSynchronise(options) {
    let delay = (options && !_.isUndefined(options.delay)?options.delay:2500);
    let sampleUploader = createSampleUploader(delay);
    let sampleDownloader = createSampleDownloader(delay);
    debug(`Starting sample syncronisation process... (delay=${delay})`);

    cancelled = false;

    function rescheduleSync() {
        isSyncing = false;
        if ( cancelled ) {
           debug("Sync cancelled — not rescheduling.");
           return Promise.resolve();
        }
        if ( options && !_.isUndefined(options.noschedule) ) {
           debug("Not rescheduling sync");
        } else {
           debug("Rescheduling sync");
           timeoutHandler = setTimeout( () => startSynchronise(options), SYNC_INTERVAL );
        }
        return Promise.resolve();
    }

    function checkCancelled() {
        if ( cancelled ) throw new Error(CANCELLED_MARKER);
    }

    if (isSyncing) {
        debug("Already syncing, aborting");
        return;
    }

    if ( ! Alloy.Globals.CerdiApi.retrieveUserToken() )  {
        debug("Not logged in, sleeping.");
        rescheduleSync();
        return;
    }

    if ( Ti.Network.networkType === Ti.Network.NETWORK_NONE ) {
        debug("No network available, sleeping until network becomes avaiable.");
        syncStore.recordOffline();
        rescheduleSync();
        return;
    }

    // flag that were are already syncing - to avoid reentrant calls
    isSyncing = true;
    syncStore.recordStart();
    info("Starting sync");
    Topics.fireTopicEvent( Topics.SYNC_STARTED );
    return Promise.resolve()
        .then(() => sampleDownloader.downloadSamples() )
        .then(checkCancelled)
        .then(() => sampleUploader.uploadSamples() )
        .then(checkCancelled)
        .then(() => {
            syncStore.recordSuccess();
            info("Sync finished successfully");
            Topics.fireTopicEvent( Topics.SYNC_FINISHED, { success: true } );
        })
        .catch( err => {
            if ( err && err.message === CANCELLED_MARKER ) {
                info("Sync aborted: user logged out.");
                Topics.fireTopicEvent( Topics.SYNC_FINISHED, { success: false, cancelled: true } );
                return;
            }
            error("Sync finished with errors");
            Logger.recordException( err );
            syncStore.recordError( err );
            Topics.fireTopicEvent( Topics.SYNC_FINISHED, { success: false, error: err } );
        })
        .finally( rescheduleSync )
}

exports.forceUpload = forceUpload;
exports.areWeSyncing = areWeSyncing;
exports.addListener = addListener;
exports.removeListener = removeListener;
exports.init = init;
