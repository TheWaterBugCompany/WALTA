var Crashlytics = require('util/Crashlytics');
var Topics = require('ui/Topics');
var moment = require("lib/moment");
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');

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

// wait for a delay then execute the promise
function delayedPromise( promise, delay) {
    return new Promise( (resolve, reject ) => {
        setTimeout(function() {
            promise
                .then(resolve)
                .catch(reject);
        }, delay);
    })
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



function errorHandler( sample ) {
    return (err) => {
        if ( err.message === "The given data was invalid.") {
            var errors = _(err.errors).values().map((e)=> e.join("\n")).join("\n");
            log(`Data was invalid continuing: ${errors}`);
        } 
        Crashlytics.recordException( err );
        return Promise.reject(err);
    };
}



function uploadSamples(delay) {
    debug(`Queuing uploading samples to server...`);

    function markSampleComplete( sample ) {
        return (res) => {
            log(`Sample [serverSampleId=${res.id}] successfully uploaded setting uploaded flag.`);
            sample.set("serverSampleId", res.id );
            sample.set("serverSyncTime", moment().valueOf());
            sample.save();
            Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
            return sample;
        };
    }

    

    function uploadRemainingSamples(samples,delay) {

        function uploadNextSample(samples,delay) {

            function uploadSampleData( sample ) {
                log(`Uploading new sample record [sampleId=${sample.get("sampleId")}]`);
                return Promise.resolve()
                        .then( () => Alloy.Globals.CerdiApi.submitSample( sample.toCerdiApiJson() ) );
            }

            function updateExistingSampleData( sample ) {
                log(`Updating existing sample [serverSampleId=${serverSampleId}]`); 
                return Promise.resolve()
                .then( () => Alloy.Globals.CerdiApi.updateSampleById( sample.get("serverSampleId"), sample.toCerdiApiJson() ) );
            }

            var sample = samples.shift();
            var uploadIfNeeded;
            var serverSampleId = sample.get("serverSampleId");
            var serverSyncTime = sample.get("serverSyncTime");
            var updatedAt = sample.get("updatedAt");
            //debug(`serverSyncTime = ${serverSyncTime}, updatedAt = ${updatedAt}`);
            if ( !serverSyncTime ) {
                
                uploadIfNeeded = delayedPromise( uploadSampleData(sample), delay )
                    .then( markSampleComplete( sample )  );
            } else if ( moment(serverSyncTime).isBefore( moment(updatedAt)) ) {
                uploadIfNeeded = delayedPromise( updateExistingSampleData( sample ), delay )
                    .then( markSampleComplete( sample )  );
            } else {
                uploadIfNeeded = Promise.resolve(sample);
            }
        
            return uploadIfNeeded
                    .then( (sample) => uploadSitePhoto(sample,delay) )
                    .then( (sample) => uploadTaxaPhotos(sample,delay) )
                    .catch( errorHandler( sample ) );
        }

        if ( samples.length > 0 ) {
            return uploadNextSample(samples,delay)
                .then( () => uploadRemainingSamples(samples,delay) )
                .catch( (err) => {
                    if ( err.message === "The given data was invalid.") {
                        return uploadRemainingSamples(samples,delay);
                    } else {
                        return Promise.reject(err);
                    }
                })
        } else {
            return Promise.resolve();
        }
    }
    
    /*
        serverSitePhotoId is used to indicate that the photo has been
        sucessfully uploaded.
    */
    function uploadSitePhoto(sample,delay) {

        function submitSitePhoto( sampleId, photoPath ) {
            log(`Uploading site photo path = ${photoPath} [serverSampleId=${sampleId}]`);
            return Promise.resolve()
                    .then(() => Alloy.Globals.CerdiApi.submitSitePhoto( sampleId, photoPath ));
        }
        
        var sitePhotoId = sample.get("serverSitePhotoId");
        if ( !sitePhotoId ) {
            var sitePhoto = sample.getSitePhoto();
            var sampleId = sample.get("serverSampleId");
            if ( sitePhoto ) {
                let blob = loadPhoto( sitePhoto );
                if ( needsOptimising(blob) ) {
                    log(`Optimising ${sitePhoto}`);
                    savePhoto( optimisePhoto(blob), sitePhoto );
                } 
                return delayedPromise( submitSitePhoto( sampleId, sitePhoto ), delay)
                        .then( (res) => {
                            sample.set("serverSitePhotoId", res.id);
                            sample.save();
                            return sample;
                        })
                        .catch( (err) => {
                            log(`Error when attempting to upload site photo: ${err.message}`);
                            return sample;
                        })
            } 
        } 
        return sample;
    }
    
    function uploadTaxaPhoto(sample,t,delay) {

        function submitCreaturePhoto( sampleId, taxonId, photoPath ) {
            log(`Uploading taxa photo path = ${photoPath} [serverSampleId=${sampleId},taxonId=${taxonId}]`);
            return Promise.resolve()
                    .then( () => Alloy.Globals.CerdiApi.submitCreaturePhoto( sampleId, taxonId, photoPath ) );
        }

        var taxonId = t.getTaxonId();
        var sampleId = sample.get("serverSampleId");
        var taxonPhotoId = t.get("serverCreaturePhotoId");
        if ( ! taxonPhotoId ) {
            var photoPath = t.getPhoto();
            if ( photoPath ) {
                
                let blob = loadPhoto( photoPath );
                if ( needsOptimising(blob) ) {
                    savePhoto( optimisePhoto( blob ), photoPath );
                } 
                return delayedPromise( submitCreaturePhoto(sampleId, taxonId, photoPath ), delay )
                        .then( (res) => {
                            t.set("serverCreaturePhotoId", res.id);
                            t.save();
                        })
                        .catch( (err) => {
                            log(`Error when attempting to taxon photo [serverSampleId=${sampleId},taxonId=${taxonId}]: ${err.message}`);
                        });
                            
            }
        }
        return Promise.resolve();
    }
    
    /*
        serverCreaturePhotoId is used to determine if this taxon photo has
        already been uploaded to the server. 
    */
    function uploadTaxaPhotos(sample,delay) {
        var taxa = sample.getTaxa();
        return taxa.reduce(
                    (uploadTaxaPhotos,t) => 
                        uploadTaxaPhotos
                            .then( uploadTaxaPhoto(sample,t,delay)),
                    Promise.resolve() )
                .then( () => sample );
            
    }
    
    
    function loadSamples() {
        var samples = Alloy.createCollection("sample");
        samples.loadUploadQueue();
        if ( samples.length === 0 )
            debug("Nothing to do - no samples to upload");
        return samples;
    }
    return Promise.resolve()
        .then(loadSamples)
        .then((samples) => uploadRemainingSamples(samples,delay) );
}

function startSynchronise() {
    let delay = 2500;
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
    function formatError(err) {
        let message = "<unknown error>";
        if ( err.error ) {
            message = err.error;
        } else if ( err.message ) {
            message = err.message;
        }
        return message;
    }

    function handleError(err) {
        debug(`Error synchronising ${formatError(err)}`)
    }
    return Promise.resolve()
        .then(checkLoggedIn) 
        .then(checkNetwork)
        .then(() => downloadSamples(delay) )
        .then(() => uploadSamples(delay) )
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
                    sample.fromCerdiApiJson(serverSample); 
                    sample.set("serverSyncTime",moment().valueOf());
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
        return Promise.resolve()
            .then( () => {
                let taxonId = taxon.get("taxonId");
                let taxonPhotoPath = `taxon_download_${taxonId}`;
                debug(`Downloading taxa photo [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
                return Alloy.Globals.CerdiApi.retrieveCreaturePhoto(serverSample.id,taxonId,taxonPhotoPath)
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
                    })
                    .catch( err => debug(`Failed to download photo for [serverSampleId=${serverSample.id},taxonId=${taxonId}]: ${formatError(err)}`));
                });
    }

    function downloadCreaturePhotos([sample,serverSample]) {
        let taxa = sample.loadTaxa();
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

exports.uploadSamples = uploadSamples;
exports.downloadSamples = downloadSamples;
exports.forceUpload = forceUpload;
exports.areWeSyncing = areWeSyncing;
exports.init = init;