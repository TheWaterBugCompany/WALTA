var SYNC_INTERVAL = 1000*60*5; // 5 minutes
var timeoutHandler;

function init() {
    Ti.API.info("Initialising SampleSync...");
    timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
}

function forceUpload() {
    if ( timeoutHandler ) {
        clearTimeout( timeoutHandler );
        timeoutHandler = null;
    }
    startUpload();
}

function uploadRemainingSamples(samples) {
    if ( samples.length > 0 ) {
        return uploadNextSample(samples)
            .then( () => uploadRemainingSamples(samples) )
    } else {
        return Promise.resolve();
    }
}

function uploadNextSample(samples) {
    var sample = samples.shift();
    Ti.API.info(JSON.stringify(sample.toCerdiApiJson()));
    return Alloy.Globals.CerdiApi.submitSample( sample.toCerdiApiJson() )
        .then( (r) => {
            sample.set("serverSampleId", r.id );
            sample.save();
            timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
        });
}

function startUpload() {
    Ti.API.info("Starting sample syncronisation process...");
    var samples = Alloy.createCollection("sample");
    samples.loadUploadQueue();
    if ( samples.length >= 1 ) {
        if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
            uploadRemainingSamples(samples)
                .catch( (e) => {
                    Ti.API.error(`Error trying to upload: ${JSON.stringify(e)}`);
                    timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
                });
        } else {
            Ti.API.info("Not logged in so can not upload!");
            timeoutHandler = setTimeout( startUpload, SYNC_INTERVAL );
        }
    } else {
        Ti.API.info("Nothing to do");
        timeoutHandler =setTimeout( startUpload, SYNC_INTERVAL );
    }
}

exports.forceUpload = forceUpload;
exports.init = init;