var Logger = require('util/Logger');
var Topics = require('ui/Topics');

var { createSampleUploader } = require("logic/SampleUploader");
var { createSampleDownloader } = require("logic/SampleDownloader");

var SYNC_INTERVAL = 1000*60*30; // 30 minutes
var isSyncing = false;

function areWeSyncing() {
    return isSyncing;
}

var log = Logger.log;
var debug = m => Ti.API.info(m);

let timeoutHandler = null;

function networkChanged( e ) {
    if ( e.networkType === Ti.Network.NETWORK_NONE ) {
        // don't bother trying to upload (saves battery)
        log("Lost network connection, sleeping.");
        clearUploadTimer();
    } else {
        log("Network connection up.");
        startSynchronise();
    }
}

function clearUploadTimer() {
    if ( timeoutHandler ) {
        clearTimeout( timeoutHandler ); 
        timeoutHandler = null;
    }
}



function init() {
    log("Initialising SampleSync...");
    Ti.Network.addEventListener( "change", networkChanged );
    Topics.subscribe( Topics.LOGGEDIN, startSynchronise );
    startSynchronise();
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
    
    
    function rescheduleSync() {
        isSyncing = false;
        if ( options && !_.isUndefined(options.noschedule) ) {
           debug("Not rescheduling sync");
        } else {
           debug("Rescheduling sync");
           timeoutHandler = setTimeout( () => startSynchronise(options), SYNC_INTERVAL );
        }
        return Promise.resolve();
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
        rescheduleSync();
        return;
    }

    // flag that were are already syncing - to avoid reentrant calls
    isSyncing = true;
    return Promise.resolve()
        .then(() => sampleDownloader.downloadSamples() )
        .then(() => sampleUploader.uploadSamples() )
        .catch( Logger.recordException )
        .finally( rescheduleSync )
}

exports.forceUpload = forceUpload;
exports.areWeSyncing = areWeSyncing;
exports.init = init;