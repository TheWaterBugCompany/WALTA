var Crashlytics = require('util/Crashlytics');
var Topics = require('ui/Topics');
var moment = require("lib/moment");
var { delayedPromise } = require("util/PromiseUtils");
var { errorHandler, formatError } = require("util/ErrorUtils");

var { createSampleUploader } = require("logic/SampleUploader");
var SYNC_INTERVAL = 1000*60*5; // 5 minutes

var isSyncing = false;

function areWeSyncing() {
    return isSyncing;
}

var log = Crashlytics.log;
var debug = m => Ti.API.info(m);

let timeoutHandler = null;

function networkChanged( e ) {
    if ( e.networkType === Ti.Network.NETWORK_NONE ) {
        // don't bother trying to upload (saves battery)
        debug("Lost network connection, sleeping.");
        clearUploadTimer();
    } else {
        debug("Network connection up.");
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
    debug("Initialising SampleSync...");
    Ti.Network.addEventListener( "change", networkChanged );
    Topics.subscribe( Topics.LOGGEDIN, startSynchronise );
    startSynchronise();
}

function forceUpload() {
    clearUploadTimer();
    return startSynchronise();
}









function startSynchronise() {
    let delay = 2500;
    let sampleUploader = createSampleUploader(delay);
    debug("Starting sample syncronisation process...");
    isSyncing = true;
    function checkNetwork() {
        if ( Ti.Network.networkType === Ti.Network.NETWORK_NONE ) {
            debug("No network available, sleeping until network becomes avaiable.");
            throw new Error("No network avaialble for synchronise");
        }
        return Promise.resolve();
    }
    function rescheduleSync() {
        isSyncing = false;
        timeoutHandler = setTimeout( startSynchronise, SYNC_INTERVAL );
        return Promise.resolve();
    }

    function checkLoggedIn() {
        if ( ! Alloy.Globals.CerdiApi.retrieveUserToken() )  {
            debug("Not logged in, sleeping.");
            throw new Error("Not logged in for synchronise");
        }
        return Promise.resolve();
    }  
   

    function handleError(err) {
        debug(`Error synchronising ${formatError(err)}`)
    }
    return Promise.resolve()
        .then(checkLoggedIn) 
        .then(checkNetwork)
        .then(() => downloadSamples(delay) )
        .then(() => sampleUploader.uploadSamples() )
        .catch( handleError )
        .finally( rescheduleSync )
}

function downloadSamples(delay) {
    debug(`Queuing sample retrieval from server... `);
    
    // only update if updated after it was last uploaded - this allows user changes
    // to not be overwritten. If the data on the server changes and the user makes a
    // change then this will always preference the server change since we always
    // call downloadSamples() before calling uploadSamples()
    function needsUpdate(serverSample,sample) {
        if ( ! sample.get("serverSampleId") ) {
            return true;
        } 

        let serverSyncTime = sample.get("serverSyncTime");
        if ( _.isUndefined(serverSyncTime) ) {
            return true;
        }

        if ( moment(serverSample.updated_at).isAfter( moment(serverSyncTime) ) ) {
           return true;
        }

        return false; // update not needed

    }
    function updateIncomingSample(serverSample) {
        let sample = Alloy.createModel("sample");
        return sample.loadByServerId(serverSample.id) 
            .then( () => {
                if ( needsUpdate(serverSample,sample) ) {
                    debug(`Updating serverSampleId = ${serverSample.id}`);
                    // must set the serverSyncTime here so that if updatedAt
                    // is set to be a few milliseconds later - this can happen if
                    // habitat blanks are filled in, and we need to signal a re-upload.
                    sample.set("serverSyncTime",moment().valueOf());
                    sample.fromCerdiApiJson(serverSample); 
                    
                    sample.save();
                    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
                    return Promise.resolve([sample,serverSample]);
                } else {
                    return Promise.resolve([sample,serverSample]);
                }
            });
    }

    function downloadSitePhoto([sample,serverSample]) {
        if ( serverSample.photos.length > 0 && !sample.get("serverSitePhotoId") ) {
            let sitePhotoPath = `site_download_${serverSample.id}`;
            debug(`Downloading site photo for ${serverSample.id}`);
            return delayedPromise( Alloy.Globals.CerdiApi.retrieveSitePhoto(serverSample.id, sitePhotoPath), delay )
                .then( photo => {
                    sample.setSitePhoto( Ti.Filesystem.applicationDataDirectory, sitePhotoPath);
                    sample.set("serverSitePhotoId", photo.id);
                    sample.save();
                    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
                    return [sample,serverSample];
                })
                .catch( err => debug(`Failed to download photo for [serverSampleId=${serverSample.id},taxonId=${taxonId}]: ${formatError(err)}`));
        } else {
            return Promise.resolve([sample,serverSample]);
        }
        
    }
    
    function downloadCreaturePhoto(taxon,serverSample) {
        let taxonId = taxon.get("taxonId");
        let taxonPhotoPath = `taxon_download_${taxonId}`;
        debug(`Downloading taxa photo [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
        return Promise.resolve()
            .then( () =>  
                Alloy.Globals.CerdiApi.retrieveCreaturePhoto(serverSample.id,taxonId,taxonPhotoPath)
                    .then( photo => {
                        if ( photo ) {
                            taxon.setPhoto( Ti.Filesystem.applicationDataDirectory, taxonPhotoPath );
                            taxon.set("serverCreaturePhotoId",photo.id);
                            taxon.save();
                            
                        } else {
                            taxon.set("serverCreaturePhotoId",0); // indicates no photo exists on the server
                            taxon.save();
                        }
                        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: taxon.getSampleId() } );
                    }))
                .catch( err => debug(`Failed to download photo for [serverSampleId=${serverSample.id},taxonId=${taxonId}]: ${formatError(err)}`));
    }

    function downloadCreaturePhotos([sample,serverSample]) {
        let taxa = sample.loadTaxa();

        // FIXME: This assumes all taxa without a serverCreaturePhotoId are
        // uploaded photos - this isn't always the case, if a sample has been edited
        // then any new taxons will have blank server ids, this causes an
        // unecessary request, which is catch by the catch() so in practice it
        // isn't problem but it would save some API calls if these weren't attempted.

        // one possiblity would be to only attempt photo downloads if a sample needs an update
        // but don't do this because it is posibile for photo's not to be downloaded due to errors
        // and the serverSyncTime is updated before downloading photos anyway.

        // maybe we need to a taxon uploadStatus field to indicate if the taxon is pending photo
        // download or has been not been uploaded yet?
        let pendingTaxaPhotos = taxa.filter( t => _.isNull(t.get('serverCreaturePhotoId')) );
        return _.reduce( pendingTaxaPhotos,  
            (queue,t) => queue.then( () => delayedPromise( downloadCreaturePhoto(t,serverSample),delay)),
            Promise.resolve());
        
    }

    function saveNewSamples( samples ) {     
        return _.reduce( samples, 
            (updateAllSamples, serverSample ) => updateAllSamples
                    .then( () => serverSample )
                    .then( updateIncomingSample )
                    .then( downloadSitePhoto )
                    .then( downloadCreaturePhotos ),
            Promise.resolve() );
    }
    return delayedPromise( Alloy.Globals.CerdiApi.retrieveSamples(), delay )
        .then( saveNewSamples );

}

exports.downloadSamples = downloadSamples;
exports.forceUpload = forceUpload;
exports.areWeSyncing = areWeSyncing;
exports.init = init;