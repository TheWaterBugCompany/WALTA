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

                // since unknown creatures are not included in the sample_creatures field
                // we add the data structure, this way we can rely on the fromCerdiApiJson
                // create the taxon records.
                function processUnknownCreatures(unknownCreatures) {
                    let creatures = serverSample.sampled_creatures;
                    unknownCreatures.forEach( (u) => {
                        creatures.push( {
                            "id": u.id,
                            "count": u.count,
                            "_serverCreaturePhotoId": u.photos[0].id
                        })
                    });
                    return serverSample;
                }

                function persistSample(sampleJson) {
                    sample.set("serverSyncTime",moment().valueOf());
                    sample.fromCerdiApiJson(sampleJson); 
                    sample.save();
                    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
             
                }
                return sample.loadByServerId(serverSample.id) 
                    .then( () => {
                        if ( needsUpdate(serverSample,sample) ) {
                            debug(`Updating serverSampleId = ${serverSample.id}`);
                            // must set the serverSyncTime here so that if updatedAt
                            // is set to be a few milliseconds later - this can happen if
                            // habitat blanks are filled in, and we need to signal a re-upload.
                            return delayedPromise( Alloy.Globals.CerdiApi.retrieveUnknownCreatures(serverSample.id), delay )
                                .then( processUnknownCreatures )
                                .then( persistSample );
                        } 
                    })
                    .then( () => [sample,serverSample]);
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
                let serverCreaturePhotoId = taxon.get("serverCreaturePhotoId");
                let taxonPhotoPath;
                let retrievePhoto;
                debug(`Downloading taxa photo [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
                
                // In the case of unknown creatures the photo id is already known so we can
                // directly retrieve the photo via this id, otherwise we need to look up the
                // latest photo via the taxonId.
                if ( serverCreaturePhotoId ) {
                    taxonPhotoPath = `taxon_download_unknown_${serverCreaturePhotoId}`
                    retrievePhoto = function() {
                        return Alloy.Globals.CerdiApi.retrievePhoto(serverCreaturePhotoId,taxonPhotoPath);
                    }
                } else {
                    taxonPhotoPath = `taxon_download_${taxonId}`
                    retrievePhoto = function() {
                        return Alloy.Globals.CerdiApi.retrieveCreaturePhoto(serverSample.id,taxonId,taxonPhotoPath);
                    };
                }
                return Promise.resolve()
                        .then( retrievePhoto)
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
            }

            function downloadCreaturePhotos([sample,serverSample]) {
                let taxa = sample.loadTaxa();

                // Download photos that haven't yet been assigned a taxonPhotoPath
                // this means photos are only ever downloaded from the server when they
                // do not exist on the client - this is a fair assumption since the photo
                // can not be changed on the server.
                let pendingTaxaPhotos = taxa.filter( t => _.isNull(t.get('taxonPhotoPath')) );
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