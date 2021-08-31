var moment = require("lib/moment");
var Topics = require('ui/Topics');
var { errorHandler, formatError } = require("util/ErrorUtils");
var { delayedPromise } = require("util/PromiseUtils");

function createSampleDownloader(delay) {
    return {
        downloadSamples() {
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

                let serverUpdateTimeM = moment(serverSample.updated_at);
                let serverSyncTimeM = moment(serverSyncTime);
                debug(`checking sample for update: serverSampleId=${sample.get("serverSampleId")} server.updatedAt = ${serverUpdateTimeM.valueOf()} serverSyncTime = ${serverSyncTimeM.valueOf()}`);
                if ( serverUpdateTimeM.isAfter(serverSyncTimeM) ) {
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
                        .catch( err => debug(`Failed to download photo for [serverSampleId=${serverSample.id}]: ${formatError(err)}`));
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

            function downloadUnknownCreatures([sample,serverSample]) {
                let taxa = sample.loadTaxa();
                function processUnknownCreatures(unknownCreatures) {
                    unknownCreatures.forEach( (u) => {
                        // look up taxon by unknownCreatureId 
                        // if not found create new one
                        // set count and photo Ids
                        // if the download creature photo code is changed to download 
                        // via the photo id then this code would work also for
                        // unknown creatures.
                        // but then there need to be a different way to indicate
                        // that a download is complete rahter than absens of server id
                        // also do we have access the creature photo id without calling
                        // the "photo meta data" function that would make things very nice.....
                    });
                }
                delayedPromise( Alloy.Globals.CerdiApi.retrieveUnknownCreatures(serverSample.id, sitePhotoPath), delay )
                        .then( processUnknownCreatures );

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
                    Promise.resolve([sample,serverSample]));
                
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
    }
};

exports.createSampleDownloader = createSampleDownloader;