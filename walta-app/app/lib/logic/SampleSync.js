var Crashlytics = require('util/Crashlytics');
var Topics = require('ui/Topics');
var moment = require("lib/moment");
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');

var SYNC_INTERVAL = 1000*60*5; // 5 minutes

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
function delayedPromise( promise, delay  ) {
    return new Promise( (resolve, reject ) => {
        setTimeout(function() {
            promise
                .then(resolve)
                .catch(reject);
        }, delay);
    })
}

/* 
    Takes an array of Promises and runs them in sequence with a fixed
    delay, this is to meet CERDI's request limits.
*/
function runNetworkQueue(ops,delay) {
    let delayedQueue = Promise.resolve();
    return ops.forEach(op => delayedQueue.then(
        delayedPromise( op, delay)
    ));
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

function uploadRemainingSamples(samples) {
    if ( samples.length > 0 ) {
        return uploadNextSample(samples)
            .then( () => uploadRemainingSamples(samples) )
            .catch( (err) => {
                if ( err.message === "The given data was invalid.") {
                    return uploadRemainingSamples(samples);
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
    log("Uploading site photo...");
    var sitePhotoId = sample.get("serverSitePhotoId");
    if ( !sitePhotoId ) {
        var sitePhoto = sample.getSitePhoto();
        var sampleId = sample.get("serverSampleId");
        log(`path = ${sitePhoto}`);
        if ( sitePhoto ) {
            let blob = loadPhoto( sitePhoto );
            if ( needsOptimising(blob) ) {
                log(`Optimising ${sitePhoto}`);
                savePhoto( optimisePhoto(blob), sitePhoto );
            } else {
                log(`Not optimising ${sitePhoto}`);
            }
            return delayedPromise( Alloy.Globals.CerdiApi.submitSitePhoto( sampleId, sitePhoto ), delay)
                    .then( (res) => {
                        sample.set("serverSitePhotoId", res.id);
                        sample.save();
                        return sample;
                    })
                    .catch( (err) => {
                        log(`Error when attempting to upload site photo: ${err.message}`);
                        return sample;
                    })
        } else {
            log("No site photo found.");
            return sample;
        }
    } else {
        log("Site photo already uploaded.");
        return sample;
    }
}

function uploadTaxaPhoto(t) {
    debug(`Uploading ${JSON.stringify(t)}`);
    var taxonId = t.getTaxonId();
    var taxonPhotoId = t.get("serverCreaturePhotoId");
    if ( ! taxonPhotoId ) {
        var photoPath = t.getPhoto();
        if ( photoPath ) {
            log(`Uploading photo for taxon ${taxonId}`);
            let blob = loadPhoto( photoPath );
            if ( needsOptimising(blob) ) {
                log(`Optimising ${photoPath} = ${blob.width}x${blob.heihgt} size = ${blob.lenght}`);
                savePhoto( optimisePhoto( blob ), photoPath );
            } else {
                log(`Not Optimising ${photoPath}`);
            }
            return Alloy.Globals.CerdiApi.submitCreaturePhoto( sampleId, taxonId, photoPath )
                    .then( (res) => {
                        t.set("serverCreaturePhotoId", res.id);
                        t.save();
                    })
                    .catch( (err) => {
                        log(`Error when attempting to taxon ${taxonId} photo: ${err.message}`);
                    });
                        
        } else {
            log(`No photo for taxon ${taxonId}`);
        }
    }
    else {
        log(`Already uploaded photo for taxon ${taxonId}`);
    }
}

/*
    serverCreaturePhotoId is used to determine if this taxon photo has
    already been uploaded to the server. 
*/
function uploadTaxaPhotos(sample,delay) {
    
    var taxa = sample.getTaxa();
    var sampleId = sample.get("serverSampleId");
    log(`Uploading ${taxa.length} taxa photos...`);
    return runNetworkQueue(
            taxa.map( t => () => uploadTaxaPhoto(t) ),
            delay ).then( () => sample );
        
}

function markSampleComplete( sample ) {
    return (res) => {
        log(`Sample ${sample.get("serverSampleId")} successfully uploaded setting uploaded flag.`);
        sample.set("serverSampleId", res.id );
        sample.set("serverSyncTime", moment().valueOf());
        sample.save();
        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
        return sample;
    };
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

function uploadNextSample(samples,delay) {
    var sample = samples.shift();
    var uploadIfNeeded;
    var serverSampleId = sample.get("serverSampleId");
    var serverSyncTime = sample.get("serverSyncTime");
    var updatedAt = sample.get("updatedAt");
    debug(`serverSyncTime = ${serverSyncTime}, updatedAt = ${updatedAt}`);
    if ( !serverSyncTime ) {
        debug(`Uploading new sample record...`);
        uploadIfNeeded = delayedPromise( Alloy.Globals.CerdiApi.submitSample( sample.toCerdiApiJson() ), delay )
            .then( markSampleComplete( sample )  );
    } else if ( moment(serverSyncTime).isBefore( moment(updatedAt)) ) {
        debug(`Updating existing sample = ${serverSampleId}...`); 
        uploadIfNeeded = Alloy.Globals.CerdiApi.updateSampleById( serverSampleId, sample.toCerdiApiJson() )
            .then( markSampleComplete( sample )  );
    } else {
        uploadIfNeeded = Promise.resolve(sample);
    }

    return uploadIfNeeded
            .then( uploadSitePhoto )
            .then( uploadTaxaPhotos )
            .catch( errorHandler( sample ) );
}

function uploadSamples() {
    debug("Uploading samples to server...");
    function loadSamples() {
        var samples = Alloy.createCollection("sample");
        samples.loadUploadQueue();
        if ( samples.length === 0 )
            debug("Nothing to do - no samples to upload");
        return samples;
    }
    return Promise.resolve()
        .then(loadSamples)
        .then(uploadRemainingSamples);
}

function startSynchronise(delay=1500) {
    debug("Starting sample syncronisation process...");
    function checkNetwork() {
        if ( Ti.Network.networkType === Ti.Network.NETWORK_NONE ) {
            debug("No network available, sleeping until network becomes avaiable.");
            throw new Error("No network avaialble for synchronise");
        }
        return Promise.resolve();
    }
    function rescheduleSync() {
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
    return Promise.resolve()
        .then(checkLoggedIn) 
        .then(checkNetwork)
        .then(() => downloadSamples(delay) )
        .then(() => uploadSamples(delay) )
        .catch( (err) => debug(`Error synchronising ${err.error}`))
        .finally( rescheduleSync )
}

function downloadSamples(delay) {
    debug("Retrieving samples from server...");
    
    // only update if updated after it was last uploaded - this allows user changes
    // to not be overwritten. If the data on the server changes and the user makes a
    // change then this will always preference the server change since we always
    // call downloadSamples() before calling uploadSamples()
    function needsUpdate(serverSample,sample) {
        if ( ! sample.get("sampleId") ) {
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
        sample.loadByServerId(serverSample.id) 
        if ( needsUpdate(serverSample,sample) ) {
            Ti.API.info(`Updating serverSampleId = ${JSON.stringify(serverSample.id)}`);
            sample.fromCerdiApiJson(serverSample);
            sample.set("serverSyncTime",moment().valueOf());
            sample.save();
            return Promise.resolve([sample,serverSample]);
        } else {
            Ti.API.info(`serverSampleId = ${JSON.stringify(serverSample.id)} doesn't need updating`);
            return Promise.resolve([sample,serverSample]);
        }
    }
    function downloadSitePhoto([sample,serverSample]) {
        if ( serverSample.photos.length > 0 ) {
            let sitePhotoPath = `site_download_${serverSample.id}`;
            return delayedPromise( Alloy.Globals.CerdiApi.retrieveSitePhoto(serverSample.id, sitePhotoPath), delay )
                .then( photo => {
                    sample.setSitePhoto( Ti.Filesystem.applicationDataDirectory, sitePhotoPath);
                    sample.set("serverSitePhotoId", photo.id);
                    sample.save();
                    return [sample,serverSample];
                });
        } else {
            return Promise.resolve([sample,serverSample]);
        }
        
    }
    function downloadCreaturePhotos([sample,serverSample]) {
        let downloadAllCreatures = [];
        let taxa = sample.loadTaxa();
        taxa.forEach( taxon => {
            debug(`processing taxon ${taxon.get("taxonId")}`)
            if ( ! taxon.get("serverCreaturePhotoId") ) {
                let taxonId = taxon.get("taxonId");
                let taxonPhotoPath = `taxon_download_${taxonId}`;
                downloadAllCreatures
                    .then( delayedPromise( Alloy.Globals.CerdiApi.retrieveCreaturePhoto(serverSample.id,taxonId,taxonPhotoPath), delay ) )
                    .then( photo => {
                        debug(`downloaded photo ${photo.id}`);
                        taxon.setPhoto( Ti.Filesystem.applicationDataDirectory, taxonPhotoPath );
                        taxon.set("serverCreaturePhotoId",photo.id);
                        taxon.save();
                    })
            }
        });

        return downloadAllCreatures;
    }
    function saveNewSamples( samples ) {
        let updateAllSamples = Promise.resolve();
        samples.forEach( serverSample => {
            updateAllSamples = updateAllSamples
                .then( () => serverSample )
                .then( updateIncomingSample )
                .then( downloadSitePhoto )
                .then( downloadCreaturePhotos );
        });
        return updateAllSamples;
    }
    return delayedPromise( Alloy.Globals.CerdiApi.retrieveSamples(), delay )
        .then( saveNewSamples );

}

exports.uploadSamples = uploadSamples;
exports.uploadNextSample = uploadNextSample;
exports.downloadSamples = downloadSamples;
exports.forceUpload = forceUpload;
exports.init = init;