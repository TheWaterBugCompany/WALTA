
var Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
var debug = m => Ti.API.info(m);

var Topics = require('ui/Topics');
var moment = require("lib/moment");
var { delayedPromise } = require("util/PromiseUtils");
var { errorHandler } = require("util/ErrorUtils");
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');

function markSampleComplete( sample ) {
    return (res) => {
        log(`Sample [serverSampleId=${res.id}] successfully uploaded setting uploaded flag.`);
        sample.set("serverSampleId", res.id );
        sample.set("serverSyncTime", moment().valueOf());
        sample.set("serverUserId", res.user_id);
        sample.save();
        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
        return sample;
    };
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
                .then( () => Alloy.Globals.CerdiApi.submitCreaturePhoto( sampleId, taxonId, photoPath ) )
                .then( (res) => {
                    Ti.API.info(`returning from submitCreaturePhoto ${JSON.stringify(res)}`);
                    return res;
                });
    }

    var taxonId = t.getTaxonId();
    var sampleId = sample.get("serverSampleId");
    var taxonPhotoId = t.get("serverCreaturePhotoId");
    Ti.API.info(`taxonPhotoId = ${taxonPhotoId}`)
    if ( ! taxonPhotoId ) {
        var photoPath = t.getPhoto();
        if ( photoPath ) {
            
            let blob = loadPhoto( photoPath );
            if ( needsOptimising(blob) ) {
                savePhoto( optimisePhoto( blob ), photoPath );
            } 
            return delayedPromise( submitCreaturePhoto(sampleId, taxonId, photoPath ), delay )
                    .then( (res) => {
                        Ti.API.info(`setting serverCreaturePhotoId = ${res.id}`);
                        t.save({"serverCreaturePhotoId": res.id});
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
    samples.loadUploadQueue(Alloy.Globals.CerdiApi.retrieveUserId());
    if ( samples.length === 0 )
        debug("Nothing to do - no samples to upload");
    return samples;
}

function createSampleUploader(delay) {
    return {
        uploadSamples() {
            debug(`Queuing uploading samples to server...`);
            return Promise.resolve()
                .then(loadSamples)
                .then((samples) => this.uploadRemainingSamples(samples) );
        },

         uploadRemainingSamples(samples) {
            if ( samples.length > 0 ) {
                return this.uploadNextSample(samples)
                    .then( () => this.uploadRemainingSamples(samples) )
                    .catch( (err) => {
                        if ( err.message === "The given data was invalid.") {
                            return this.uploadRemainingSamples(samples);
                        } else {
                            return Promise.reject(err);
                        }
                    })
            } else {
                return Promise.resolve();
            }
        },

        uploadNextSample(samples) {
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

    }
}

exports.createSampleUploader = createSampleUploader;