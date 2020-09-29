var Crashlytics = require('util/Crashlytics');
var Topics = require('ui/Topics');
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');

var SYNC_INTERVAL = 1000*60*5; // 5 minutes

var log = Crashlytics.log;
var debug = m => Ti.API.debug(m);

let timeoutHandler = null;

function networkChanged( e ) {
    if ( e.networkType === Ti.Network.NETWORK_NONE ) {
        // don't bother trying to upload (saves battery)
        debug("Lost network connection, sleeping.");
        clearUploadTimer();
    } else {
        debug("Network connection up.");
        startUpload();
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
    Topics.subscribe( Topics.LOGGEDIN, startUpload );
    startUpload();
}

function forceUpload() {
    clearUploadTimer();
    return startUpload();
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

function uploadSitePhoto(sample) {
    log("Uploading site photo...");
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
        return Alloy.Globals.CerdiApi.submitSitePhoto( sampleId, sitePhoto )
                .then( () => sample );
    } else {
        log("No site photo found.");
        return sample;
    }
}

function uploadTaxaPhotos(sample) {
    
    var taxa = sample.getTaxa();
    var sampleId = sample.get("serverSampleId");
    log(`Uploading ${taxa.length} taxa photos...`);
    return taxa.reduce( (acc, t) => {
            return acc.then( () => {
                debug(`Uploading ${JSON.stringify(t)}`);
                var taxonId = t.getTaxonId();
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
                                
                } else {
                    log(`No photo for taxon ${taxonId}`);
                }
            })
        }, Promise.resolve() ).then( () => sample );
        
}

function setServerSampleId( sample ) {
    return (r) => {
        debug(`success, server returned id = ${r.id}`);
        sample.set("serverSampleId", r.id );
        sample.save();
        return sample;
    }
}

function markSampleComplete( sample ) {
    log(`Sample ${sample.get("serverSampleId")} and photos successfully uploaded setting uploaded flag.`);
    sample.set("uploaded", 1);
    sample.save();
    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("id") } );
    return sample;
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

function uploadNextSample(samples) {
    var sample = samples.shift();
    var uploadIfNeeded;
    var serverSampleId = sample.get("serverSampleId");

    if ( !serverSampleId ) {
        debug(`Uploading new sample record...`);
        uploadIfNeeded = Alloy.Globals.CerdiApi.submitSample( sample.toCerdiApiJson() );
    } else {
        debug(`Attempting re-upload of ${serverSampleId} photo records...`);
        uploadIfNeeded = Promise.resolve( { id: serverSampleId }); 
    }

    return uploadIfNeeded
            .then( setServerSampleId( sample ) )
            .then( uploadSitePhoto )
            .then( uploadTaxaPhotos )
            .then( markSampleComplete )
            .catch( errorHandler( sample ) );
}

function startUpload() {
    debug("Starting sample syncronisation process...");
    if ( Ti.Network.networkType === Ti.Network.NETWORK_NONE ) {
        debug("No network available, sleeping until network becomes avaiable.");
        return Promise.resolve(false);
    }

    var samples = Alloy.createCollection("sample");
    samples.loadUploadQueue();
    if ( samples.length >= 1 ) {
        if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
            return uploadRemainingSamples(samples)
                .then( () => timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL ) )
                .catch( (error) => { 
                    debug(`Rescheduling upload...`);
                    timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
                });
        } else {
            debug("Not logged in so can not upload!");
            timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
        }
    } else {
        debug("Nothing to do");
        timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
    }
    return Promise.resolve(false);
}

exports.uploadNextSample = uploadNextSample;
exports.forceUpload = forceUpload;
exports.init = init;