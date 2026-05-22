
var Logger = require('util/Logger');
var log = (m, tag = "sync") => Logger.log(m, tag);
var debug = (m, tag = "sync") => Logger.debug(m, tag);
var info = (m, tag = "sync") => Logger.info(m, tag);
var warn = (m, tag = "sync") => Logger.warn(m, tag);
var error = (m, tag = "sync") => Logger.error(m, tag);

var Topics = require('ui/Topics');
var moment = require("lib/moment");
var { delayedPromise } = require("util/PromiseUtils");
var { errorHandler, formatError } = require("util/ErrorUtils");
var { needsOptimising, optimisePhoto, savePhoto, loadPhoto } = require('util/PhotoUtils');



/* If an edited sample has been saved during the upload process then
   we need make sure we don't rewrite the old record to the database,
   instead we need to record the serverSampleId in the new record. */
function loadCorrectSampleToUpdate(sample) {
    let sampleId =sample.get("sampleId");
    sample.clear();

    // attempt to reload
    sample.loadById(sampleId);

    // if the sample has been deleted load the temporary version instead
    if ( ! sample.get("sampleId") ) {
        debug("reloading")
        sample.loadByOriginalId(sampleId);
    }
}
/*
    serverSitePhotoId is used to indicate that the photo has been
    sucessfully uploaded.
*/
function uploadSitePhoto(sample,delay) {

    function submitSitePhoto( sampleId, photoPath ) {
        info(`Uploading site photo path = ${photoPath} [serverSampleId=${sampleId}]`);
        return Promise.resolve()
                .then(() => Alloy.Globals.CerdiApi.submitSitePhoto( sampleId, photoPath ));
    }

    log(`Checking to see if we need to upload site photo`)
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
            log(`Uploading site photo: ${sitePhoto}`);
            return delayedPromise( submitSitePhoto( sampleId, sitePhoto ), delay)
                    .then( (res) => {
                        loadCorrectSampleToUpdate(sample);
                        sample.save({
                            "serverSitePhotoId": res.id
                        });
                        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId, message: "Uploading site photo" } );
                        return sample;
                    })
                    .catch( (err) => {
                        Logger.recordException(err);
                        return sample;
                    })
        } 
    } 
    return sample;
}

function uploadTaxaPhoto(sample,t,delay) {

    function submitCreaturePhoto( sampleId, taxonId, photoPath ) {
        info(`Uploading taxa photo path = ${photoPath} [serverSampleId=${sampleId},taxonId=${taxonId}]`);
        return Promise.resolve()
                .then( () => Alloy.Globals.CerdiApi.submitCreaturePhoto( sampleId, taxonId, photoPath ) )
                .then( (res) => {
                    debug(`returning from submitCreaturePhoto ${JSON.stringify(res)}`);
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
                        debug(`setting serverCreaturePhotoId = ${res.id}`);
                        t.save({"serverCreaturePhotoId": res.id});
                        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId, message: `Uploading taxa ${taxonId} photo` } );
                    })
                    .catch( (err) => {
                        error(`Error when attempting to upload taxon photo [serverSampleId=${sampleId},taxonId=${taxonId}]`)
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
        info(`Uploading unknown creature and photo [serverSampleId=${sampleId},taxonId=${taxonId}]`);
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
                t.save({
                    "serverCreatureId": res.id,
                    "serverCreaturePhotoId": res.photos[0].id
                });
                Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId, message: "Uploading unknown creature" } );
            })
            .catch( (err) => {
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

        info(`Deleting unknown creature: id = ${creatureId} [serverSampleId=${sampleId}]`);
        return delayedPromise( Promise.resolve().then( () => Alloy.Globals.CerdiApi.deleteUnknownCreature(creatureId) ), delay )
            .then( (res) => {
                t.destroy();
            })
            .catch( Logger.recordException );
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

function createSampleUploader(delay, progress) {
    progress = progress || { plan() {}, tick() {} };
    return {
        uploadSamples() {
            debug(`Queuing uploading samples to server...`);
            return Promise.resolve()
                .then(loadSamples)
                .then((samples) => {
                    const planned = samples.length;
                    progress.plan( planned );
                    return this.uploadRemainingSamples(samples).then( () => planned );
                });
        },

         uploadRemainingSamples(samples) {
            if ( samples.length > 0 ) {
                return this.uploadNextSample(samples)
                    .then( () => progress.tick() )
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
                info(`Uploading new sample record [sampleId=${sample.get("sampleId")}]`);
               return Promise.resolve()
                        .then( () => Alloy.Globals.CerdiApi.submitSample( sampleCerdiJson ) )
            }
        
            function updateExistingSampleData( sample ) {
                info(`Updating existing sample [serverSampleId=${serverSampleId}]`);
                return Promise.resolve()
                    .then( () => Alloy.Globals.CerdiApi.updateSampleById( sample.get("serverSampleId"), sampleCerdiJson ) );
            }

            

            function updateSample(res) {
                info(`Sample [serverSampleId=${res.id}] successfully uploaded setting uploaded flag.`);
                loadCorrectSampleToUpdate(sample);
                sample.save({
                    "serverSampleId": res.id,
                    "serverUserId": res.user_id
                });
                Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId"), message: `Uploading sample id: ${sample.get("sampleId")}` } );
    

            }

            function markSampleComplete(sample, delay) {
                
                return delayedPromise(
                    Promise.resolve()
                        .then( () => {
                            info("Upload successful.");
                            loadCorrectSampleToUpdate(sample);
                            sample.set("serverSyncTime", moment().valueOf());
                            sample.save();
                        }), delay)
            }

            //debug(`serverSyncTime = ${serverSyncTime}, updatedAt = ${updatedAt}`);
            if ( !serverSampleId ) {
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
                        .then( (sample) => markSampleComplete(sample,delay) )
                        .catch( Logger.recordException );
            } else {
                return Promise.resolve(sample);
            }
        
                     
        }

    }
}

exports.createSampleUploader = createSampleUploader;