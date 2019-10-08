var Topics = require('ui/Topics');
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');

var SYNC_INTERVAL = 1000*60*5; // 5 minutes
var timeoutHandler;

function debug(mess) { 
    Ti.API.info(mess);
}

Topics.subscribe( Topics.LOGGEDIN, startUpload );

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

Ti.Network.addEventListener( "change", networkChanged );


function clearUploadTimer() {
    if ( timeoutHandler ) {
        clearTimeout( timeoutHandler );
        timeoutHandler = null;
    }
}

function init() {
    debug("Initialising SampleSync...");
    startUpload();
}

function forceUpload() {
    clearUploadTimer();
    startUpload();
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
    debug("Uploading site photo...");
    var sitePhoto = sample.getSitePhoto();
    var sampleId = sample.get("serverSampleId");
    debug(`path = ${sitePhoto}`);
    if ( sitePhoto ) {
        let blob = loadPhoto( sitePhoto );
        if ( needsOptimising(blob) ) {
            debug(`Optimising ${sitePhoto}`);
            savePhoto( optimisePhoto(blob), sitePhoto );
        } else {
            debug(`Not optimising ${sitePhoto}`);
        }
        return Alloy.Globals.CerdiApi.submitSitePhoto( sampleId, sitePhoto )
                .then( () => sample );
    } else {
        debug("No site photo found.");
        return sample;
    }
}

function uploadTaxaPhotos(sample) {
    
    var taxa = sample.getTaxa();
    var sampleId = sample.get("serverSampleId");
    debug(`Uploading ${taxa.length} taxa photos...`);
    return taxa.reduce( (acc, t) => {
            return acc.then( () => {
                debug(`Uploading ${JSON.stringify(t)}`);
                var taxonId = t.getTaxonId();
                var photoPath = t.getPhoto();
                if ( photoPath ) {
                    debug(`Uploading photo for taxon ${taxonId}`);
                    let blob = loadPhoto( photoPath );
                    if ( needsOptimising(blob) ) {
                        debug(`Optimising ${photoPath}`);
                        savePhoto( optimisePhoto( blob ), photoPath );
                    } else {
                        debug(`Optimising ${photoPath}`);
                    }
                    return Alloy.Globals.CerdiApi.submitCreaturePhoto( sampleId, taxonId, photoPath )
                                
                } else {
                    debug(`No photo for taxon ${taxonId}`);
                }
            })
        }, Promise.resolve() ).then( () => sample );
        
}

function setServerSampleId( sample ) {
    return (r) => {
        Ti.API.info(`success, server returned id = ${r.id}`);
        sample.set("serverSampleId", r.id );
        sample.save();
        return sample;
    }
}

function markSampleComplete( sample ) {
    Ti.API.info(`Sample ${sample.get("serverSampleId")} and photos successfully uploaded setting uploaded flag.`);
    sample.set("uploaded", 1);
    sample.save();
    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("id") } );
    return sample;
}

function errorHandler( sample ) {
    return (err) => {
        if ( err.message === "The given data was invalid.") {
            var errors = _(err.errors).values().map((e)=> e.join("\n")).join("\n");
            debug(`Data was invalid continuing: ${errors}`);
            sample.set("lastError", errors );
            sample.save();
        } else {
            sample.set("lastError", err.message );
            sample.save();
        }
        return Promise.reject(err);
    };
}

function uploadNextSample(samples) {
    var sample = samples.shift();
    var uploadIfNeeded;
    var serverSampleId = sample.get("serverSampleId");

    if ( !serverSampleId ) {
        Ti.API.info(`Uploading new sample record...`);
        uploadIfNeeded = Alloy.Globals.CerdiApi.submitSample( sample.toCerdiApiJson() );
    } else {
        Ti.API.info(`Attempting re-upload of ${serverSampleId} photo records...`);
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
        return;
    }

    var samples = Alloy.createCollection("sample");
    samples.loadUploadQueue();
    if ( samples.length >= 1 ) {
        if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
            uploadRemainingSamples(samples)
                .then( () => timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL ) )
                .catch( (error) => { 
                    debug(`Error trying to upload: ${JSON.stringify(error)}`);
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
}

exports.uploadNextSample = uploadNextSample;
exports.forceUpload = forceUpload;
exports.init = init;