var Logger = require('util/Logger');
var moment = require("lib/moment");
var Topics = require('ui/Topics');
var { delayedPromise } = require("util/PromiseUtils");
var log = (m, tag = "sync") => Logger.log(m, tag);
var debug = (m, tag = "sync") => Logger.debug(m, tag);
var info = (m, tag = "sync") => Logger.info(m, tag);
var warn = (m, tag = "sync") => Logger.warn(m, tag);
var error = (m, tag = "sync") => Logger.error(m, tag);
function createSampleDownloader(delay) {
    return {
        downloadSamples() {
            debug(`Queuing sample retrieval from server... `);
            
            // only update if updated after it was last uploaded - this allows user changes
            // to not be overwritten.
            function needsUpdate(serverSample,sample) {

                debug(`Checking if sampleId=${sample.get("sampleId")} needs downloading `);
                // This can be true if the sample wasn't reviously on the device sibce a new 
                // record as been created and this will be blank.
                if ( ! sample.get("serverSampleId") ) {
                    debug(`Yes there is no serverSampleId yet.`);
                    return true;
                } 

                let serverSyncTime = sample.get("serverSyncTime");
                if ( _.isUndefined(serverSyncTime) ) {
                    debug(`Yes there is no serverSyncTime yet.`);
                    return true;
                }
                
                let serverUpdateTimeM = moment(serverSample.updated_at);
                let serverSyncTimeM = moment(serverSyncTime); 

                debug(`serverUpdateTimeM=${serverSyncTimeM.valueOf()} serverSyncTimeM=${serverSyncTimeM.valueOf()}`);

                // We need to subtract a small window to account for upload delay; otherwise
                // a download will be intitiated every time an upload occurs.
                if ( serverUpdateTimeM.subtract(10,"s").isAfter(serverSyncTimeM) ) {
                    debug(`Yes the sample was updated on the server after the sync.`);
                    return true;
                }

                debug(`No download needed.`);

                return false; // update not needed

            }
            function updateIncomingSample(serverSample) {
                let sample = Alloy.createModel("sample");
                // The sync time is set to when we started the download process
                // so that if the habitat update code sets the updatedAt field
                // it is guarenteeed to be sooner than the eventual serverSyncTime.
                let syncedAt = moment().valueOf();

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
                    sample.fromCerdiApiJson(sampleJson); 
                    sample.save();
                    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
             
                }
                function setTimestamp(){
                    log(`Setting serverSyncTime [sampleId=${sample.get("sampleId")}] ${syncedAt}`)
                    sample.set("serverSyncTime",syncedAt);
                    sample.save();
                }
                function retrieveUnknownCreatures() {
                    return delayedPromise( Promise.resolve().then( () => Alloy.Globals.CerdiApi.retrieveUnknownCreatures(serverSample.id) ), delay )
                }
                return sample.loadByServerId(serverSample.id)
                    .then( () => {
                        if ( needsUpdate(serverSample,sample) ) {
                            info(`Updating serverSampleId = ${serverSample.id}`);
                            // serverSyncTime is set right after persistSample so that an
                            // updatedAt bumped a few ms later (e.g. habitat blanks being
                            // filled in) lands after it and signals a re-upload.
                            return Promise.resolve()
                                .then( retrieveUnknownCreatures )
                                .then( processUnknownCreatures )
                                .then( persistSample )
                                .then( setTimestamp );
                        }
                    })
                    // Photo downloads run on every sync, independent of the metadata
                    // needsUpdate gate, so a photo that failed to download earlier (e.g.
                    // marginal network) is retried without re-persisting sample metadata
                    // (WB-101). Both steps are no-ops once nothing is outstanding.
                    .then( () => [sample,serverSample] )
                    .then( downloadSitePhoto )
                    .then( downloadCreaturePhotos )
                    .then( () => [sample,serverSample]);
            }

            function downloadSitePhoto([sample,serverSample]) {
                // Skip when we already have it — photos are immutable on the server,
                // so a present serverSitePhotoId means there's nothing to re-fetch.
                if ( serverSample.photos.length > 0 && ! sample.get("serverSitePhotoId") ) {
                    let sitePhotoPath = `site_download_${serverSample.id}`;
                    info(`Downloading site photo for ${serverSample.id}`);
                    return delayedPromise( Alloy.Globals.CerdiApi.retrieveSitePhoto(serverSample.id, sitePhotoPath), delay )
                        .then( photo => {
                            sample.setSitePhoto( Ti.Filesystem.applicationDataDirectory, sitePhotoPath);
                            sample.set("serverSitePhotoId", photo.id);
                            sample.save();
                            Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
                            return [sample,serverSample];
                        })
                        .catch( err => {
                            error(`Failed to download photo for [serverSampleId=${serverSample.id}]`)
                            Logger.recordException(err);
                            return [sample, serverSample];
                        });
                } else {
                    return Promise.resolve([sample,serverSample]);
                }
                
            }
            
            function downloadCreaturePhoto(taxon,serverSample) {
                let taxonId = taxon.get("taxonId");
                let serverCreaturePhotoId = taxon.get("serverCreaturePhotoId");
                let taxonPhotoPath;
                let retrievePhoto;
                info(`Downloading taxa photo [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
                
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
                        .then( retrievePhoto )
                        .then( photo => {
                            if ( photo ) {
                                taxon.setPhoto( Ti.Filesystem.applicationDataDirectory, taxonPhotoPath );
                                taxon.set("serverCreaturePhotoId",photo.id);
                                taxon.save();
                            } else {
                                warn(`Missing photo for [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
                                // indicates no photo exists on the server - but is not null to prevent future
                                // uploads from trying to upload 
                                taxon.set("serverCreaturePhotoId",0); 
                                taxon.save();
                            }
                            Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: taxon.getSampleId() } );
                        })
                        .catch( err => {
                            error(`Failed to download photo for [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
                            Logger.recordException(err)
                        });
            }

            function downloadCreaturePhotos([sample,serverSample]) {
                let taxa = sample.loadTaxa();

                // Download photos that haven't yet been assigned a taxonPhotoPath
                // this means photos are only ever downloaded from the server when they
                // do not exist on the client - this is a fair assumption since the photo
                // can not be changed on the server.
                // serverCreaturePhotoId === 0 marks "no photo on the server" (set by
                // downloadCreaturePhoto), so it's excluded — only fresh or previously
                // failed photos remain pending and get (re)tried (WB-101).
                let pendingTaxaPhotos = taxa.filter( t => _.isNull(t.get("taxonPhotoPath")) && t.get("serverCreaturePhotoId") !== 0 );
                return _.reduce( pendingTaxaPhotos,  
                    (queue,t) => queue.then( () => delayedPromise( downloadCreaturePhoto(t,serverSample),delay)),
                    Promise.resolve())
                    .then(()=>[sample,serverSample])
                
            }

            function saveNewSamples( samples ) {     
                return _.reduce( samples, 
                    (updateAllSamples, serverSample ) => updateAllSamples
                            .then( () => serverSample )
                            .then( updateIncomingSample ),Promise.resolve() );
            }
            return delayedPromise( Alloy.Globals.CerdiApi.retrieveSamples(), delay )
                .then( saveNewSamples );

        }
    }
};

exports.createSampleDownloader = createSampleDownloader;