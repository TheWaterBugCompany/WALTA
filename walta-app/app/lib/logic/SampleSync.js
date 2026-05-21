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
// Persisted across launches: records that the user has asked for a full
// history sync (download + upload) that hasn't completed yet. We never
// *initiate* a full sync automatically, but a user-requested one is
// resumed until it succeeds — across network drops, backgrounding and
// app restarts (WB-8).
const FULL_SYNC_PENDING_KEY = "fullSyncPending";

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

function isFullSyncPending() {
    return Ti.App.Properties.getBool(FULL_SYNC_PENDING_KEY, false);
}

function setFullSyncPending(value) {
    Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, value);
}

function hasPendingUploads() {
    let userId = Alloy.Globals.CerdiApi.retrieveUserId();
    let samples = Alloy.createCollection("sample");
    samples.loadUploadQueue(userId);
    return samples.length > 0;
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

function networkChanged( e ) {
    if ( e.networkType === Ti.Network.NETWORK_NONE ) {
        // don't bother trying to upload (saves battery)
        info("Lost network connection, sleeping.");
        clearUploadTimer();
    } else {
        info("Network connection up.");
        resumeInterruptedWork();
    }
}

function appResumed() {
    debug("App resumed to foreground.");
    resumeInterruptedWork();
}

function init() {
    log("Initialising SampleSync...");
    Ti.Network.addEventListener( "change", networkChanged );
    Topics.subscribe( Topics.LOGGEDIN, () => resumeInterruptedWork() );
    Topics.subscribe( Topics.LOGGEDOUT, onLoggedOut );
    Topics.subscribe( Topics.UPLOAD_PROGRESS, handleUploadProgress );
    if ( Titanium.Platform.name === 'android' ) {
        Ti.Android.currentActivity.addEventListener( 'resume', appResumed );
    } else {
        Ti.App.addEventListener( 'resumed', appResumed );
    }
    // Never initiate a sync on launch. Only resume work the user already
    // asked for — a pending full sync, or queued uploads (WB-8). Gated on
    // an established session so we don't race a not-yet-ready login (WB-103).
    if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
        resumeInterruptedWork();
    }
}

function onLoggedOut() {
    info("Logged out — cancelling any in-flight sync and stopping the schedule.");
    cancelled = true;
    clearUploadTimer();
    setFullSyncPending(false);
}

// User tapped Sync: a full history sync (download + upload). Records the
// intent so it survives interruption, then runs.
function forceSync(options) {
    setFullSyncPending(true);
    clearUploadTimer();
    return runSync({ download: true, options });
}

// Background upload of the pending-upload queue only — no historical
// download. Fired on survey submit and when resuming queued uploads.
function uploadPending(options) {
    return runSync({ download: false, options });
}

// Continue work the user has already requested, without ever initiating a
// fresh full sync. A pending full sync wins; otherwise flush queued uploads.
function resumeInterruptedWork(options) {
    if ( ! Alloy.Globals.CerdiApi.retrieveUserToken() ) {
        debug("Not logged in — nothing to resume.");
        return;
    }
    if ( isFullSyncPending() ) {
        debug("Resuming pending full sync.");
        return forceSync(options);
    }
    if ( hasPendingUploads() ) {
        debug("Resuming pending uploads.");
        return uploadPending(options);
    }
    debug("Nothing pending to resume.");
}

function runSync({ download, options }) {
    let delay = (options && !_.isUndefined(options.delay)?options.delay:2500);
    let sampleUploader = createSampleUploader(delay);
    let sampleDownloader = createSampleDownloader(delay);
    debug(`Starting ${download?"full sync":"upload"} process... (delay=${delay})`);

    cancelled = false;

    function scheduleRetry() {
        isSyncing = false;
        if ( cancelled ) {
           debug("Sync cancelled — not rescheduling.");
           return Promise.resolve();
        }
        if ( options && !_.isUndefined(options.noschedule) ) {
           debug("Not rescheduling sync");
           return Promise.resolve();
        }
        // Backstop retry only when work remains; an empty queue with no
        // pending full sync leaves no lingering timer.
        if ( isFullSyncPending() || hasPendingUploads() ) {
           debug("Work remains — scheduling retry");
           timeoutHandler = setTimeout( resumeInterruptedWork, SYNC_INTERVAL );
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
        return;
    }

    if ( Ti.Network.networkType === Ti.Network.NETWORK_NONE ) {
        debug("No network available, sleeping until network becomes avaiable.");
        syncStore.recordOffline();
        scheduleRetry();
        return;
    }

    // flag that were are already syncing - to avoid reentrant calls
    isSyncing = true;
    syncStore.recordStart();
    info(`Starting ${download?"sync":"upload"}`);
    Topics.fireTopicEvent( Topics.SYNC_STARTED );
    return Promise.resolve()
        .then(() => download ? sampleDownloader.downloadSamples() : undefined )
        .then(checkCancelled)
        .then(() => sampleUploader.uploadSamples() )
        .then(checkCancelled)
        .then(() => {
            if ( download ) setFullSyncPending(false);
            syncStore.recordSuccess();
            info(`${download?"Sync":"Upload"} finished successfully`);
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
        .finally( scheduleRetry )
}

exports.forceSync = forceSync;
exports.uploadPending = uploadPending;
exports.resumeInterruptedWork = resumeInterruptedWork;
exports.areWeSyncing = areWeSyncing;
exports.addListener = addListener;
exports.removeListener = removeListener;
exports.init = init;
