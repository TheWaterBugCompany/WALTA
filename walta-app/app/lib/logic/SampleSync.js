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
// A user-requested full sync, persisted so it resumes until it succeeds; never auto-set (WB-8).
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

// Expose the store's read-side getters so consumers can read SampleSync like a SyncStore.
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

function countPendingUploads() {
    let userId = Alloy.Globals.CerdiApi.retrieveUserId();
    let samples = Alloy.createCollection("sample");
    samples.loadUploadQueue(userId);
    return samples.length;
}

function hasPendingUploads() {
    return countPendingUploads() > 0;
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
        return resumeInterruptedWork();
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
    // Never auto-initiate; only resume user-requested work, and only with a session (WB-103).
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

// User tapped Sync: a full history sync (download + upload), resumable across interruption.
function forceSync(options) {
    setFullSyncPending(true);
    clearUploadTimer();
    return runSync({ download: true, options });
}

// Upload the pending queue only — no history download (survey submit, resume).
function uploadPending(options) {
    return runSync({ download: false, options });
}

// Resume user-requested work only: a pending full sync wins, else flush queued uploads.
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

    // Combined-pool progress: one running fraction across the download and
    // upload phases. Upload work is countable up front, so seed it before
    // the download phase plans its own count — that keeps the bar from
    // jumping backwards when uploads begin after a download.
    let progressDone = 0, progressTotal = countPendingUploads();
    function tick(message) {
        progressDone++;
        syncStore.recordProgress(message, { current: progressDone, total: progressTotal });
    }
    let downloadProgress = { plan: (n) => { progressTotal += n; }, tick };
    let uploadProgress = { plan() {}, tick };

    let sampleUploader = createSampleUploader(delay, uploadProgress);
    let sampleDownloader = createSampleDownloader(delay, downloadProgress);
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
        // Only reschedule when work remains, so an idle queue leaves no lingering timer.
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

    isSyncing = true;
    syncStore.recordStart();
    Topics.fireTopicEvent( Topics.SYNC_STARTED );
    let didDownload = download;
    let downloadedCount = 0, uploadedCount = 0;
    function syncPass( withDownload ) {
        return Promise.resolve()
            .then(() => withDownload ? sampleDownloader.downloadSamples() : 0 )
            .then((n) => { downloadedCount += (n || 0); checkCancelled(); })
            .then(() => sampleUploader.uploadSamples() )
            .then((n) => { uploadedCount += (n || 0); checkCancelled(); });
    }
    return syncPass( download )
        .then(() => {
            // A full sync requested while this one was already running set
            // fullSyncPending mid-flight (forceSync bailed on the isSyncing
            // guard). Run its download now, in this same session, so the
            // request isn't dropped, deferred to the backstop timer, or
            // reported complete before the download actually happened.
            if ( !didDownload && isFullSyncPending() ) {
                didDownload = true;
                return syncPass( true );
            }
        })
        .then(() => {
            if ( didDownload ) setFullSyncPending(false);
            syncStore.recordSuccess();
            // Only narrate a sync that actually moved data; an idle check
            // leaves just a debug breadcrumb so the log isn't dominated by
            // empty-sync brackets.
            if ( downloadedCount + uploadedCount > 0 ) {
                info(`Sync finished: downloaded ${downloadedCount}, uploaded ${uploadedCount}`);
            } else {
                debug(`Sync check complete — nothing to ${didDownload?"sync":"upload"}`);
            }
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
exports.networkChanged = networkChanged;
exports.areWeSyncing = areWeSyncing;
exports.addListener = addListener;
exports.removeListener = removeListener;
exports.init = init;
