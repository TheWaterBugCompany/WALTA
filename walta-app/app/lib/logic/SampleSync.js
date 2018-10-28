var Topics = require('ui/Topics');

var SYNC_INTERVAL = 1000*60*5; // 5 minutes
var timeoutHandler;


Topics.subscribe( Topics.LOGGEDIN, startUpload );

function networkChanged( e ) {
    if ( e.networkType === Ti.Network.NETWORK_NONE ) {
        // don't bother trying to upload (saves battery)
        Ti.API.info("Lost network connection, sleeping.");
        clearUploadTimer();
    } else {
        Ti.API.info("Network connection up.");
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
    Ti.API.info("Initialising SampleSync...");
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
    Ti.API.info("Uploading site photo...");
    var sitePhoto = sample.getSitePhoto();
    var sampleId = sample.get("serverSampleId");
    if ( sitePhoto ) {
        return Alloy.Globals.CerdiApi.submitSitePhoto( sampleId, sitePhoto )
                .then( () => sample );
    } else {
        Ti.API.info("No site photo found.");
        return sample;
    }
}

function uploadTaxaPhotos(sample) {
    
    var taxa = sample.getTaxa();
    var sampleId = sample.get("serverSampleId");
    Ti.API.info(`Uploading ${taxa.length} taxa photos...`);
    return taxa.reduce( (acc, t) => {
            return acc.then( () => {
                Ti.API.info(`Uploading ${JSON.stringify(t)}`);
                var taxonId = t.getTaxonId();
                var photo = t.getPhoto();
                if ( photo ) {
                    Ti.API.info(`Uploading photo for taxon ${taxonId}`);
                    return Alloy.Globals.CerdiApi.submitCreaturePhoto( sampleId, taxonId, photo )
                                
                } else {
                    Ti.API.info(`No photo for taxon ${taxonId}`);
                }
            })
        }, Promise.resolve() ).then( () => sample );
        
}

function setServerSampleId( sample ) {
    return (r) => {
        Ti.API.info(`success, server returned: ${JSON.stringify(r)}`);
        sample.set("serverSampleId", r.id );
        sample.save();
        return sample;
    }
}

function markSampleComplete( sample ) {
        sample.set("uploaded", 1);
        sample.save();
        return sample;
}

function errorHandler( sample ) {
    return (err) => {
        if ( err.message === "The given data was invalid.") {
            var errors = _(err.errors).values().map((e)=> e.join("\n")).join("\n");
            Ti.API.info(`Data was invalid continuing: ${errors}`);
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

    if ( !serverSampleId )
        uploadIfNeeded = Alloy.Globals.CerdiApi.submitSample( sample.toCerdiApiJson() )
    else
        uploadIfNeeded = Promise.resolve( { id: serverSampleId }); 

    return uploadIfNeeded
            .then( setServerSampleId( sample ) )
            .then( uploadSitePhoto )
            .then( uploadTaxaPhotos )
            .then( markSampleComplete )
            .catch( errorHandler( sample ) );
}

function startUpload() {
    Ti.API.info("Starting sample syncronisation process...");
    if ( Ti.Network.networkType === Ti.Network.NETWORK_NONE ) {
        Ti.API.info("No network available, sleeping until network becomes avaiable.");
        return;
    }

    var samples = Alloy.createCollection("sample");
    samples.loadUploadQueue();
    if ( samples.length >= 1 ) {
        if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
            uploadRemainingSamples(samples)
                .then( () => timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL ) )
                .catch( (error) => { 
                    Ti.API.info(`Error trying to upload: ${JSON.stringify(error)}`);
                    timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
                });
        } else {
            Ti.API.info("Not logged in so can not upload!");
            timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
        }
    } else {
        Ti.API.info("Nothing to do");
        timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
    }
}

exports.forceUpload = forceUpload;
exports.init = init;