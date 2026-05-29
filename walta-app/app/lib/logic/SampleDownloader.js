var Logger = require('util/Logger');
var moment = require("lib/moment");
var Topics = require('ui/Topics');
var { delayedPromise } = require("util/PromiseUtils");
var log = (m, tag = "sync") => Logger.log(m, tag);
var debug = (m, tag = "sync") => Logger.debug(m, tag);
var info = (m, tag = "sync") => Logger.info(m, tag);
var warn = (m, tag = "sync") => Logger.warn(m, tag);
var error = (m, tag = "sync") => Logger.error(m, tag);

// Does the server's copy of this sample have changes the local doesn't? Pure
// read against `serverSyncTime` so it can drive both the real download and the
// lightweight probe that auto-clears the sync-recommended badge (WB-114).
function needsUpdate(serverSample, sample) {
    if ( ! sample.get("serverSampleId") ) return true;

    let serverSyncTime = sample.get("serverSyncTime");
    if ( _.isUndefined(serverSyncTime) ) return true;

    // 10s grace so the timestamp drift between our just-finished upload and the
    // server's updated_at doesn't re-pull the same sample.
    return moment(serverSample.updated_at).subtract(10, "s").isAfter(moment(serverSyncTime));
}

function createSampleDownloader(delay, progress) {
    progress = progress || { plan() {}, tick() {} };
    return {
        downloadSamples() {
            debug(`Queuing sample retrieval from server... `);
            let updatedCount = 0;
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
                    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId"), message: "Downloading sample" } );

                }
                function setTimestamp(){
                    log(`Setting serverSyncTime [sampleId=${sample.get("sampleId")}] ${syncedAt}`)
                    sample.set("serverSyncTime",syncedAt);
                    sample.save();
                    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId") } );
                }
                function retrieveUnknownCreatures() {
                    return delayedPromise( Promise.resolve().then( () => Alloy.Globals.CerdiApi.retrieveUnknownCreatures(serverSample.id) ), delay )
                }
                return sample.loadByServerId(serverSample.id)
                    .then( () => {
                        if ( needsUpdate(serverSample,sample) ) {
                            info(`Updating serverSampleId = ${serverSample.id}`);
                            updatedCount++;
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
                // No site photo to account for at all — keep plan and tick aligned by
                // simply doing nothing here (the planning pre-pass also skipped it).
                if ( serverSample.photos.length === 0 ) {
                    return Promise.resolve([sample,serverSample]);
                }
                // Skip when we already have it — photos are immutable on the server,
                // so a present serverSitePhotoId means there's nothing to re-fetch.
                if ( sample.get("serverSitePhotoId") ) {
                    progress.tick();
                    return Promise.resolve([sample,serverSample]);
                }
                let sitePhotoPath = `site_download_${serverSample.id}`;
                info(`Downloading site photo for ${serverSample.id}`);
                return delayedPromise( Alloy.Globals.CerdiApi.retrieveSitePhoto(serverSample.id, sitePhotoPath), delay )
                    .then( photo => {
                        sample.setSitePhoto( Ti.Filesystem.applicationDataDirectory, sitePhotoPath);
                        sample.set("serverSitePhotoId", photo.id);
                        sample.save();
                        Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sample.get("sampleId"), message: "Downloading site photo" } );
                        progress.tick();
                        return [sample,serverSample];
                    })
                    .catch( err => {
                        error(`Failed to download photo for [serverSampleId=${serverSample.id}]`)
                        Logger.recordException(err);
                        progress.tick();
                        return [sample, serverSample];
                    });
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
                            Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: taxon.getSampleId(), message: "Downloading taxa photo" } );
                        })
                        .catch( err => {
                            error(`Failed to download photo for [serverSampleId=${serverSample.id},taxonId=${taxonId}]`);
                            Logger.recordException(err)
                        });
            }

            function downloadCreaturePhotos([sample,serverSample]) {
                let taxa = sample.loadTaxa();

                // Iterate ALL taxa, not just the pending ones: download photos that
                // haven't been fetched yet (taxonPhotoPath null, server says it has one),
                // and tick either way so per-photo progress accounting stays aligned
                // with the metadata-based plan even on resync where most photos are
                // already local.
                // serverCreaturePhotoId === 0 marks "no photo on the server", so it's
                // excluded — only fresh or previously failed photos get (re)tried (WB-101).
                return taxa.reduce(
                    (queue,t) => queue
                        .then( () => {
                            if ( _.isNull(t.get("taxonPhotoPath")) && t.get("serverCreaturePhotoId") !== 0 ) {
                                return delayedPromise( downloadCreaturePhoto(t,serverSample), delay );
                            }
                        })
                        .then( () => progress.tick() ),
                    Promise.resolve())
                    .then(()=>[sample,serverSample])

            }

            function saveNewSamples( samples ) {
                // Plan once for both samples and their photos, from the GET /samples
                // metadata: a stable denominator avoids the bar jumping mid-stream
                // when photos start downloading.
                let photoCount = samples.reduce(
                    (sum, s) => sum + (s.photos.length > 0 ? 1 : 0) + s.sampled_creatures.length,
                    0);
                progress.plan( samples.length + photoCount );
                // Isolate each sample: a transient failure on one (e.g. 5xx
                // after retries exhausted) leaves that sample without a
                // serverSyncTime so the next sync retries it, while the rest
                // of the queue still drains.
                return _.reduce( samples,
                    (updateAllSamples, serverSample ) => updateAllSamples
                            .then( () => updateIncomingSample(serverSample) )
                            .catch( err => {
                                error(`Failed to download sample [serverSampleId=${serverSample.id}] — leaving pending for next sync`);
                                Logger.recordException(err);
                            })
                            .then( () => progress.tick() ),Promise.resolve() )
                    .then( () => updatedCount );
            }
            return delayedPromise( Alloy.Globals.CerdiApi.retrieveSamples(), delay )
                .then( saveNewSamples );

        }
    }
};

exports.createSampleDownloader = createSampleDownloader;
exports.needsUpdate = needsUpdate;