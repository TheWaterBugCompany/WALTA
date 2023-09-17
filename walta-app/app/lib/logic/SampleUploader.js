
var Logger = require('util/Logger');
var log = Logger.log;
var debug = m => Ti.API.info(m);

var Topics = require('ui/Topics');
var moment = require("lib/moment");
var { delayedPromise } = require("util/PromiseUtils");
var { errorHandler, formatError } = require("util/ErrorUtils");
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');



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
                        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId} );
                        return sample;
                    })
                    .catch( (err) => {
                        log(`Error when attempting to upload site photo: ${formatError(message)}`);
                        Logger.recordException(err);
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
    // don't upload photos for unknown bugs here
    if ( ! taxonPhotoId && (taxonId != null) ) {
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
                        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId} );
                    })
                    .catch( (err) => {
                        Logger.log(`Error when attempting to upload taxon photo [serverSampleId=${sampleId},taxonId=${taxonId}]`)
                        Logger.recordException(err)
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
    let taxa = sample.getTaxa();
    return taxa.reduce(
                (uploadTaxaPhotos,t) => 
                    uploadTaxaPhotos
                        .then( uploadTaxaPhoto(sample,t,delay)),
                Promise.resolve() )
            .then( () => sample );
        
}

function uploadUnknownCreature(sample,t,delay) {
    var taxonId = t.getTaxonId();
    var sampleId = sample.get("serverSampleId");
    var serverCreatureId = t.get("serverCreatureId");
    var taxonPhotoId = t.get("serverCreaturePhotoId");

    // skip known creatures and any unknown creatures that have had
    // their serverCreaturePhotoId set.
    if ( taxonId == null ) {
        let photoPath = t.getPhoto();
        let count = t.getAbundance();
        if ( photoPath ) {
            
            let blob = loadPhoto( photoPath );
            if ( needsOptimising(blob) ) {
                savePhoto( optimisePhoto( blob ), photoPath );
            } 
            let actions;
            
            if ( !serverCreatureId ) { 
                actions = delayedPromise( Promise.resolve().then( () => Alloy.Globals.CerdiApi.submitUnknownCreature(sampleId, count, photoPath ) ), delay );
            } else {
                actions = delayedPromise( Promise.resolve().then( () => Alloy.Globals.CerdiApi.updateUnknownCreature(serverCreatureId,count,photoPath) ), delay);
            }
            return actions.then( (res) => {
                            Ti.API.info(`setting serverCreatureId = ${res.id}`);
                            t.save("serverCreatureId", res.id)
                            t.save({"serverCreaturePhotoId": res.photos[0].id});
                            Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId} );
                        })
                        .catch( (err) => {
                            log(`Error when attempting to upload unknown creature and photo [serverSampleId=${sampleId},taxonId=${taxonId}]: ${formatError(err)}`);
                            Logger.recordException(err);
                        });
                    
                        
        }
    }
    return Promise.resolve();
}

function uploadUnknownCreatures(sample,delay) {
    let taxa = sample.getTaxa();
    return taxa.reduce( 
        (uploadUnknown,t) => 
            uploadUnknown.then( uploadUnknownCreature(sample,t,delay)),
                Promise.resolve() )
        .then( () => sample );
}

function deletePendingUnknownCreatures(sample,delay) {
    function deleteUnknownCreature(sample,t) {
        let creatureId = t.get("serverCreatureId");
        let sampleId = sample.get("sampleId");
        let taxonId = sample.get("taxonId");

        if ( !creatureId || taxonId ) {
            t.destroy();
            return Promise.resolve();
        }

        log(`Deleting unknown creature: id = ${creatureId} [serverSampleId=${sampleId}]`);
        return delayedPromise( Promise.resolve().then( () => Alloy.Globals.CerdiApi.deleteUnknownCreature(creatureId) ), delay )
            .then( (res) => {
                t.destroy();
            })
            .catch( (err) => {
                log(`Error when attempting to delete unknown creature [serverSampleId=${sampleId},id=${creatureId}]: ${formatError(err)}`);
                Logger.recordException(err);
            });
    }
    let taxa = Alloy.createCollection("taxa");
    taxa.loadPendingDelete( sample.get("sampleId") );
    return taxa.reduce( 
        (deleteUnkown,t) => 
            deleteUnkown.then( deleteUnknownCreature(sample,t)),
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
            log(`Queuing uploading samples to server...`);
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
            var sample = samples.shift();
            var uploadOrUpdate;
            var serverSampleId = sample.get("serverSampleId");
            var serverSyncTime = sample.get("serverSyncTime");

            // strip out any unknown creatures before sending them to server; they use a different API
            let sampleCerdiJson = sample.toCerdiApiJson();
            let [ identifiedCreatures, unknownCreatures ] = _.partition(sampleCerdiJson.creatures, (c)=>(c.creature_id!=null))
            sampleCerdiJson.creatures = identifiedCreatures;
           
            function uploadSampleData( sample ) {
                log(`Uploading new sample record [sampleId=${sample.get("sampleId")}]`);
               return Promise.resolve()
                        .then( () => Alloy.Globals.CerdiApi.submitSample( sampleCerdiJson ) );
            }
        
            function updateExistingSampleData( sample ) {
                log(`Updating existing sample [serverSampleId=${serverSampleId}]`); 
                return Promise.resolve()
                    .then( () => Alloy.Globals.CerdiApi.updateSampleById( sample.get("serverSampleId"), sampleCerdiJson ) );
            }

            function updateSample(res) {
                log(`Sample [serverSampleId=${res.id}] successfully uploaded setting uploaded flag.`);
                sample.set("serverSampleId", res.id );
                sample.set("serverUserId", res.user_id);
                sample.save();
                Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
            }

            function markSampleComplete() {
                log("Upload successful.")
                sample.set("serverSyncTime", moment().valueOf());
                sample.save();
            }

            //debug(`serverSyncTime = ${serverSyncTime}, updatedAt = ${updatedAt}`);
            if ( !serverSyncTime ) {
                uploadOrUpdate = delayedPromise( uploadSampleData(sample), delay );
            } else if ( sample.hasPendingUploads() ) {
                uploadOrUpdate = delayedPromise( updateExistingSampleData( sample ), delay );
            } 

            if ( uploadOrUpdate ) {
                return uploadOrUpdate
                        .then( updateSample )
                        .then( () => sample  )
                        .then( (sample) => uploadSitePhoto(sample,delay) )
                        .then( (sample) => uploadTaxaPhotos(sample,delay) )
                        .then( (sample) => uploadUnknownCreatures(sample,delay))
                        .then( (sample) => deletePendingUnknownCreatures(sample,delay))
                        .then( markSampleComplete )
                        .catch( errorHandler );
            } else {
                return Promise.resolve(sample);
            }
        
                     
        }

    }
}

exports.createSampleUploader = createSampleUploader;