require("spec/lib/ti-mocha");
var simple = require("spec/lib/simple-mock");
var moment = require("lib/moment");
var { delayedPromise } = require("util/PromiseUtils");
var { makeCerdiSampleData, makeSampleData } = require("spec/fixtures/SampleData_fixture.js");

var { use, expect } = require("spec/lib/chai");
var { makeTestPhoto, waitForTick, removeDatabase, resetSample, clearDatabase } = require("spec/util/TestUtils");
var { loadPhoto, needsOptimising } = require('util/PhotoUtils');
var { createCerdiApi } = require("spec/mocks/MockCerdiApi");
var { createSampleUploader } = require("logic/SampleUploader");
var { createSampleDownloader } = require("logic/SampleDownloader");
use(require('spec/lib/chai-date-string'));


Alloy.Globals.CerdiApi = createCerdiApi();

var Sample = require("logic/Sample");
var Taxon = require("logic/Taxon");
var SampleSync = require('logic/SampleSync');
var Topics = require('ui/Topics');



function clearMockSampleData() {
    clearDatabase();
    Alloy.Collections.sample = null;
    Alloy.Collections.taxa = null;
    Alloy.Models.sample = null;
    Alloy.Models.taxa = null;
}


describe("SampleSync", function () {
    this.afterEach( function() {
        simple.restore();
    })

    async function raceEditAndUpload(desc, delay) {
        function checkSamples(number) {
            let samples = Alloy.createCollection("sample");
            samples.fetch({
                query: 'SELECT * FROM sample'
            });
            expect(samples.length,`samples.length for ${desc}`).equals(number);
            return samples;
        }

        clearMockSampleData();

        let sample = makeSampleData( { 
            sitePhotoPath: makeTestPhoto("site.jpg"),
            dateCompleted:  moment().valueOf()
        });
        
        checkSamples(0);
        sample.save(); 

        let taxon = Alloy.createModel("taxa", { 
            taxonId: 1, sampleId: sample.get("sampleId"), 
            taxonPhotoPath: makeTestPhoto("taxon.jpg"), 
            abundance: "1-2", 
            updatedAt: 0 
        });
        taxon.save();
        let taxon2 = Alloy.createModel("taxa", { 
            taxonId: 2, sampleId: sample.get("sampleId"), 
            taxonPhotoPath: makeTestPhoto("taxon2.jpg"), 
            abundance: "3-5", updatedAt: 0
         });
        taxon2.save();

        checkSamples(1);
        Ti.API.info(`sampleId = ${sample.get("sampleId")}`)
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
            .returnWith(38);
        simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
            .resolveWith({id:1});
        simple.mock(Alloy.Globals.CerdiApi,"submitSample")
            .resolveWith({id:666});
        simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
            .resolveWith({id:2})
            .resolveWith({id:3});
        
        let tempSample = sample.createTemporaryForEdit();
        checkSamples(2);

        tempSample.set("waterbodyName", "edited");

        // start uploading original sample
        let uploadingPromise = createSampleUploader().uploadSamples();

        // save the editted copy
        let savePromise = new Promise( (resolve) => setTimeout( () => { 
                tempSample.saveCurrentSample();
                resolve();
            }, delay ));

        await Promise.all([uploadingPromise,savePromise]);
       
        // SHOULD only upload the old record NOT the
        // record being currently edited.
        expect(Alloy.Globals.CerdiApi.submitSample.callCount, "submitSample call count").to.equal(1);
        
        // TODO: Fix the promise chain to ensure taxa photos complete
        // properly
        
        //expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount, "submitCreaturePhoto call count").to.equal(2);
        // see if the original still exists
        let samples = checkSamples(1);
        expect(samples.at(0).get("waterbodyName")).equals("edited");
        expect(samples.at(0).get("serverSampleId")).equals(666);
    }
    it("should not create a duplicate if edited before uploaded", async function() {
        await raceEditAndUpload( "Site Photo Race", 220 );
        await raceEditAndUpload( "Upload Sample Race", 50 );
        await raceEditAndUpload( "Mark Completed Race", 480 );
    });

    it("Should continue if there is an error in submitting a photo", async () => {
        clearMockSampleData();

        let sample = makeSampleData( { 
            sitePhotoPath: makeTestPhoto("site.jpg"),
            dateCompleted:  moment().valueOf()
        });
        sample.save(); 

        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
            .returnWith(38);
        simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
            .callFn( () => delayedPromise( Promise.resolve().then( () => { throw new Error("injected") } ), 100) );
        simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .callFn( () => delayedPromise( Promise.resolve({id:666}), 100) );

        await createSampleUploader().uploadSamples(); 
        sample.loadById( sample.get("sampleId") );
        expect(sample.get("serverSyncTime")).to.be.greaterThan(0)
    });

    it("should resize photos if they are too large", async function () {
        clearMockSampleData();
        
        let samples = Alloy.Collections.instance("sample");
        let taxa = Alloy.Collections.instance("taxa");

        let sample = Alloy.createModel("sample", { sitePhotoPath: makeTestPhoto("site.jpg") });
        sample.save();

        let taxon = Alloy.createModel("taxa", { 
            taxonId: 1, sampleId: sample.get("sampleId"),
            taxonPhotoPath: makeTestPhoto("taxon.jpg"), abundance: "1-2", 
            updatedAt: 0 
        });
        taxa.add(taxon);

        taxon.save();
        samples.add(sample);

        simple.mock(Alloy.Globals.CerdiApi,"submitSample")
               .resolveWith({id:666});
        simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
            .resolveWith({id:1});
        simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
            .resolveWith({id:2})
            .resolveWith({id:3});

        await createSampleUploader().uploadNextSample(samples);
        expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount, "submitSitePhoto").to.equal(1);
        expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount, "submitCreaturePhoto").to.equal(1);
        function expectPhotoOptimised(path) {
            var photo = loadPhoto(path);
            expect(needsOptimising(photo)).to.be.false;
            expect(photo.length).to.be.below(4 * 1014 * 1024);
            //expect(photo.width).to.be.at.most(1600);
            //expect(photo.height).to.be.at.most(1200);
        }
        expectPhotoOptimised(Alloy.Globals.CerdiApi.submitSitePhoto.lastCall.args[1]);
        expectPhotoOptimised(Alloy.Globals.CerdiApi.submitCreaturePhoto.lastCall.args[2]);
    });

    // WB-167: SampleHistory resolves UPLOAD_PROGRESS by local sampleId, so every
    // step must report the local id. The photo steps used to report serverSampleId.
    it("reports UPLOAD_PROGRESS with the local sampleId for every step, including photos", async function () {
        clearMockSampleData();

        let samples = Alloy.Collections.instance("sample");
        let taxa = Alloy.Collections.instance("taxa");

        let sample = Alloy.createModel("sample", { sitePhotoPath: makeTestPhoto("site.jpg") });
        sample.save();
        let localId = sample.get("sampleId");

        let taxon = Alloy.createModel("taxa", {
            taxonId: 1, sampleId: localId,
            taxonPhotoPath: makeTestPhoto("taxon.jpg"), abundance: "1-2", updatedAt: 0
        });
        taxa.add(taxon);
        taxon.save();
        samples.add(sample);

        simple.mock(Alloy.Globals.CerdiApi, "submitSample").resolveWith({ id: 666 });
        simple.mock(Alloy.Globals.CerdiApi, "submitSitePhoto").resolveWith({ id: 1 });
        simple.mock(Alloy.Globals.CerdiApi, "submitCreaturePhoto").resolveWith({ id: 2 });

        let progressIds = [];
        let onProgress = (payload) => progressIds.push(payload.id);
        Topics.subscribe(Topics.UPLOAD_PROGRESS, onProgress);
        try {
            await createSampleUploader().uploadNextSample(samples);
        } finally {
            Topics.unsubscribe(Topics.UPLOAD_PROGRESS, onProgress);
        }

        expect(progressIds.length, "some UPLOAD_PROGRESS events fired").to.be.greaterThan(0);
        expect(progressIds.every(id => id === localId),
            `every UPLOAD_PROGRESS id should be local sampleId ${localId}, got ${JSON.stringify(progressIds)}`)
            .to.be.true;
    });
    /*
        Sample Sync upload
        - polls every fifteen minutes to upload
        - if there is anything to do must run the download first (to avoid race conditions, ensuriung server updates take priority)
        - for each sample that has a updated date greater than the server updated date
          - upload sample details
        - for each site/taxon photo that doesn't have a server id (indicating it is newly taken)
          - upload to server

        on errors:
        - if the sample upload fails reschedule in fifteen minutes.
        - if a photo upload fails reschedule but only upload individual photos thathave failed
            - set photo server id to null
            - if a photo is successfully uploaded set it to server photo id
            - if a server photo id is set then don't try to upload again
    */
    context("Sample Sync Upload", function () {
        this.beforeEach(function () {
            clearMockSampleData();
        });
        this.afterEach(function() {
            simple.restore();
        })
        
        it('should upload new samples to server',async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            
            let sample = makeSampleData();
            sample.save(); 
            await createSampleUploader().uploadSamples();
            sample.clear();
            sample.loadByServerId(123);
            expect(sample).to.be.ok;
            expect(sample.get("serverSampleId")).to.equal(123);
            expect(sample.get("serverUserId")).to.equal(38);
            expect(Alloy.Globals.CerdiApi.submitSample.callCount).to.equal(1);
            expect(Alloy.Globals.CerdiApi.submitSample.calls[0].args[0].waterbody_name).to.equal("test water body name");
            expect(sample.get("serverSyncTime")).to.be.a('number');
        });
        it('returns the count of uploaded samples and reports progress per sample plus its site photo', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId").returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample").resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            let sample = makeSampleData();
            sample.save();
            const planned = [], ticks = [];
            const progress = { plan: (n) => planned.push(n), tick: () => ticks.push(1) };
            const count = await createSampleUploader(progress).uploadSamples();
            expect(count, "uploaded count").to.equal(1);
            expect(planned.reduce((a,b)=>a+b,0), "planned total (sample + site photo)").to.equal(2);
            expect(ticks.length, "ticks (sample + site photo)").to.equal(2);
        });
        it('reports progress for each pending taxon photo upload alongside the sample', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId").returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample").resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto").resolveWith({id:7});
            let sample = makeSampleData();
            sample.save();
            let t1 = Alloy.createModel("taxa", { sampleId: sample.get("sampleId"), taxonId: 1, taxonPhotoPath: makeTestPhoto("taxon1.jpg"), abundance: "1-2", updatedAt: 0 });
            t1.save();
            let t2 = Alloy.createModel("taxa", { sampleId: sample.get("sampleId"), taxonId: 2, taxonPhotoPath: makeTestPhoto("taxon2.jpg"), abundance: "3-5", updatedAt: 0 });
            t2.save();
            const planned = [], ticks = [];
            const progress = { plan: (n) => planned.push(n), tick: () => ticks.push(1) };
            await createSampleUploader(progress).uploadSamples();
            expect(planned.reduce((a,b)=>a+b,0), "planned total (sample + site + 2 taxa)").to.equal(4);
            expect(ticks.length, "ticks (sample + site + 2 taxa)").to.equal(4);
        });
        it('fires UPLOAD_PROGRESS after the sample is marked complete (serverSyncTime set)', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId").returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample").resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            let sample = makeSampleData();
            sample.save();
            const captures = [];
            const handler = (e) => {
                const m = Alloy.createModel("sample");
                m.loadById(e && e.id);
                captures.push({ id: e && e.id, sst: m.get("serverSyncTime") || 0 });
            };
            Topics.subscribe(Topics.UPLOAD_PROGRESS, handler);
            try {
                await createSampleUploader().uploadSamples();
            } finally {
                Topics.unsubscribe(Topics.UPLOAD_PROGRESS, handler);
            }
            expect(captures.length, "at least one UPLOAD_PROGRESS fired").to.be.at.least(1);
            const last = captures[captures.length - 1];
            expect(last.id, "last event was for our sample").to.equal(sample.get("sampleId"));
            expect(last.sst, "last fire happened after serverSyncTime was set").to.be.greaterThan(0);
        });
        it('should upload modified samples to the server', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:123});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            let sample = makeSampleData();
            sample.set("serverSyncTime", moment("2020-01-01").valueOf());
            sample.set("serverSampleId", 123);
            sample.set("waterbodyName", "updated"); 
            sample.set("updatedAt", moment().valueOf());
            sample.save();
            await  createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.updateSampleById.callCount).to.equal(1);
            expect(Alloy.Globals.CerdiApi.updateSampleById.calls[0].args[1].waterbody_name).to.equal("updated");
        });
       
        it('should upload new site photos', async function() {
            let sample = makeSampleData( { sitePhotoPath: makeTestPhoto("site.jpg") });
            sample.save(); 
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666});
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(1);
            expect(Alloy.Globals.CerdiApi.submitSitePhoto.calls[0].args[1]).to.contain("site.jpg");

        });
        it('should upload new taxon photos', async function() {
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), 
                abundance: "1-2", updatedAt: 0 
            });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), 
                abundance: "3-5", updatedAt: 0
             });
            taxon2.save();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:9});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
                .resolveWith({id:1})
                .resolveWith({id:2}); 
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666});
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount, "submitCreaturePhoto calls").to.equal(2);
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.calls[0].args[2]).to.contain("taxon.jpg");
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.calls[1].args[2]).to.contain("taxon2.jpg");

        });
        it('should NOT upload old site photos again',async function() {
            let sample = makeSampleData( { sitePhotoPath: makeTestPhoto("site.jpg") });
            sample.save(); 
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666});
            await createSampleUploader().uploadSamples();
            sample.loadByServerId(666);
            sample.set("updatedAt", moment().add(1, "days").valueOf());
            sample.save();
            expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(1);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(0);

        });
        it('should NOT upload old taxon photos again',async function() {
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), 
                abundance: "1-2", updatedAt: 0
             });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), 
                abundance: "3-5", updatedAt: 0
             });
            taxon2.save();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
                .resolveWith({id:1})
                .resolveWith({id:2});
            await createSampleUploader().uploadSamples(); 
            // database saves happen asyncronously this introduces a race condition
            // so we need to wait for a few millseconds for the database to be saved
            // otherwise the final serverCreaturePhotoId may not be set yet.
            // FIXME: Is there a way to recieve an event when the database operations
            // are complete - waiting for a fixed time is not ideal here.
            await waitForTick(10)();   
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(2);
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
                .resolveWith({id:1})
                .resolveWith({id:2});
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            sample.loadByServerId(666);
            sample.set("updatedAt", moment().add(1, "days").valueOf());
            sample.save();
            Ti.API.debug(`Uploading after setting uodatedAt to ${sample.get("updatedAt")}`)
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(0);
        });
        it('should upload failed site photos uploads again',function() {
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .rejectWith({message:"test error"});
            let sample = makeSampleData( { sitePhotoPath: makeTestPhoto("site.jpg") });
            sample.save(); 
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666,user_id:38});
            return createSampleUploader().uploadSamples()
                .finally( () => expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(1) )
                .finally( () => createSampleUploader().uploadSamples() )
                .finally( () => expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(2) );
        });
        it('should upload failed taxon photos uploads again',function() {
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto").rejectWith({message:"test error"});
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), 
                abundance: "1-2", updatedAt: 0
             });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), 
                abundance: "3-5", updatedAt: 0
             });
            taxon2.save();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:87});
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666,user_id:38});

            return createSampleUploader().uploadSamples()
                .then( () => expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(2) )
                .then( () => createSampleUploader().uploadSamples() )
                .then( () => expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(4) );
        });
        it('should upload new photo if taxon photo is changed', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: 1, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), 
                abundance: "1-2", updatedAt: 0
             });
            taxon.save();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
                .resolveWith({id:1})
                .resolveWith({id:2});
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666,user_id:38});
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(1);
            taxon.setPhoto(makeTestPhoto("taxon.jpg"));
            taxon.save();
            sample.set("updatedAt",moment().valueOf());
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(2);

        });
        it('should upload new photo if site photo is changed', async function() {
            let sample = makeSampleData( { sitePhotoPath: makeTestPhoto("site.jpg") });
            sample.save();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                   .resolveWith({id:666});
            await createSampleUploader().uploadSamples();
            // change photo
            sample.setSitePhoto(makeTestPhoto("site.jpg"));
            sample.save();
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(2);
        });

        it('keeps processing remaining samples when one sample upload fails', async function() {
            // A transient failure uploading one sample (e.g. 5xx after retries
            // exhausted) must not strand the rest of the queue. The failing
            // sample stays pending so a later sync retries it.
            let firstSample = makeSampleData({ waterbodyName: "first" });
            firstSample.save();
            let doomedSample = makeSampleData({ waterbodyName: "doomed" });
            doomedSample.save();
            let thirdSample = makeSampleData({ waterbodyName: "third" });
            thirdSample.save();

            simple.mock(Alloy.Globals.CerdiApi, "retrieveUserId").returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi, "submitSitePhoto").resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi, "submitSample")
                .callFn((sampleJson) => {
                    if (sampleJson.waterbody_name === "doomed") {
                        return Promise.reject(new Error("HTTP 503"));
                    }
                    let nextId = sampleJson.waterbody_name === "first" ? 1001 : 1003;
                    return Promise.resolve({ id: nextId, user_id: 38 });
                });

            await createSampleUploader().uploadSamples();

            let firstReloaded = Alloy.createModel("sample");
            firstReloaded.loadById(firstSample.get("sampleId"));
            expect(firstReloaded.get("serverSampleId"), "first sample uploaded").to.equal(1001);
            expect(firstReloaded.get("serverSyncTime"), "first sample marked complete").to.be.a("number");

            let thirdReloaded = Alloy.createModel("sample");
            thirdReloaded.loadById(thirdSample.get("sampleId"));
            expect(thirdReloaded.get("serverSampleId"), "third sample uploaded after failed second").to.equal(1003);
            expect(thirdReloaded.get("serverSyncTime"), "third sample marked complete").to.be.a("number");

            let doomedReloaded = Alloy.createModel("sample");
            doomedReloaded.loadById(doomedSample.get("sampleId"));
            expect(doomedReloaded.get("serverSampleId"), "failed sample left pending for retry").to.not.be.ok;
            expect(doomedReloaded.get("serverSyncTime"), "failed sample not marked complete").to.not.be.a("number");
        });
    });

    /*
        Sample Sync download
         - starts when you open the app (polls for internet activity)
         - once its done once it slows poll down to 24 hours (in case the app is left open again) unless there is somehting to upload.

         - retrieves all the sample records from server
         - for each sample update the local database iff:
           - the last updated date is greater than the local last uploaded date
           - or the record doesn't current exist (based on serverSampleId)
         - for each photo site:
            - if the server photo id doesn't match any on the device then download them
         - for each taxa photo:
            - if the server photo id doesn't match any on the device then download them

        Need to add a server id for each photo and an uploaded date.
    */
    context("Sample Sync Download", function () {
        this.beforeEach(function () {
            clearMockSampleData();
        });
        it('should download new samples from the server', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    user_id: 38,
                    sampled_creatures: [
                        {
                            "id": 2390,
                            "sample_id": 473,
                            "creature_id": 1,
                            "count": 2,
                            "photos_count": 0
                        },
                        {
                            "id": 2391,
                            "sample_id": 473,
                            "creature_id": 2,
                            "count": 6,
                            "photos_count": 0
                        }
                    ]
                })]);
                Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId,creatureId,photoPath ) {
                    Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_01.jpg")
                        .copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                    return Promise.resolve({id: 1});
                };              
            await createSampleDownloader().downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            let taxa = sample.loadTaxa();
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("dateCompleted")).to.equal("2020-09-25T09:41:46+00:00");
            expect(parseFloat(sample.get("lat"))).to.equal(-37.5622);
            expect(parseFloat(sample.get("lng"))).to.equal(143.8750300);
            // no accuracy field on server 
            expect(sample.get("surveyType")).to.equal(Sample.SURVEY_DETAILED);
            expect(sample.get("waterbodyType")).to.equal(Sample.WATERBODY_RIVER);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name");
            expect(sample.get("nearbyFeature")).to.equal("test nearby feature");
            // not notes field in local database
            expect(sample.get("boulder")).to.equal(17);
            expect(sample.get("gravel")).to.equal(13);
            expect(sample.get("sandOrSilt")).to.equal(9);
            expect(sample.get("leafPacks")).to.equal(16);
            expect(sample.get("wood")).to.equal(11);
            expect(sample.get("aquaticPlants")).to.equal(14);
            expect(sample.get("openWater")).to.equal(12);
            expect(sample.get("edgePlants")).to.equal(8);
            // check creatures
            expect(taxa.length, "taxa.length").to.equal(2);
            expect(taxa.at(0).get("taxonId")).to.equal(1);
            expect(taxa.at(0).get("abundance")).to.equal("1-2");
            expect(taxa.at(1).get("taxonId")).to.equal(2);
            expect(taxa.at(1).get("abundance")).to.equal("6-10");
            expect(sample.get("serverUserId")).to.equal(38);
        });
        it('returns the count of updated samples and reports progress per sample', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({user_id:38})]);
            const planned = [], ticks = [];
            const progress = { plan: (n) => planned.push(n), tick: () => ticks.push(1) };
            const count = await createSampleDownloader(progress).downloadSamples();
            expect(count, "updated count").to.equal(1);
            expect(planned.reduce((a,b)=>a+b,0), "planned total").to.equal(1);
            expect(ticks.length, "ticks").to.equal(1);
        });
        it('reports progress for the site photo alongside the sample', async function () {
            let siteMock = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/spec/resources/site-mock.jpg");
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({ photos: [{"id": 1948}] })]);
            Alloy.Globals.CerdiApi.retrieveSitePhoto = function (serverSampleId, photoPath) {
                siteMock.copy(Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve({"id": 1948});
            };
            const planned = [], ticks = [];
            const progress = { plan: (n) => planned.push(n), tick: () => ticks.push(1) };
            await createSampleDownloader(progress).downloadSamples();
            expect(planned.reduce((a,b)=>a+b,0), "planned total (sample + site photo)").to.equal(2);
            expect(ticks.length, "ticks (sample + site photo)").to.equal(2);
        });
        it('reports progress for each creature photo alongside the sample', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    sampled_creatures: [
                        { "id": 2390, "sample_id": 473, "creature_id": 1, "count": 2, "photos_count": 1 },
                        { "id": 2391, "sample_id": 473, "creature_id": 2, "count": 5, "photos_count": 1 }
                    ]
                })]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveCreaturePhoto")
                .rejectWith({ message: "no photo" });
            const planned = [], ticks = [];
            const progress = { plan: (n) => planned.push(n), tick: () => ticks.push(1) };
            await createSampleDownloader(progress).downloadSamples();
            expect(planned.reduce((a,b)=>a+b,0), "planned total (sample + 2 creature photos)").to.equal(3);
            expect(ticks.length, "ticks (sample + 2 creature photos)").to.equal(3);
        });
        it('fires UPLOAD_PROGRESS after setTimestamp finishes (serverSyncTime set)', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({user_id:38, sampled_creatures: []})]);
            const captures = [];
            const handler = (e) => {
                const m = Alloy.createModel("sample");
                m.loadById(e && e.id);
                captures.push({ id: e && e.id, sst: m.get("serverSyncTime") || 0 });
            };
            Topics.subscribe(Topics.UPLOAD_PROGRESS, handler);
            try {
                await createSampleDownloader().downloadSamples();
            } finally {
                Topics.unsubscribe(Topics.UPLOAD_PROGRESS, handler);
            }
            expect(captures.length, "at least one UPLOAD_PROGRESS fired").to.be.at.least(1);
            const last = captures[captures.length - 1];
            expect(last.sst, "last fire happened after serverSyncTime was set").to.be.greaterThan(0);
        });
        it('should update existing samples if they have been updated on the server', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({user_id:38})]);
            // create existing sample to update
            let sample = Alloy.createModel("sample");
            sample.set("serverSampleId", 473);
            sample.set("serverSyncTime", 1); // a long time ago
            sample.set("waterbodyName", "existing waterbody name");
            sample.save();

            await createSampleDownloader().downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.createModel("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name");
            expect(sample.get("serverUserId")).to.equal(38);

        });
        it('should NOT update existing samples if they have been updated on the server but we have already downloaded that update', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            // if updated_at < serverSyncTime then do not overwrite local changes
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    updated_at: moment("2020-03-01").format()
                })]);
            let sample = makeSampleData({});
            sample.set("serverSyncTime", moment("2020-04-01").valueOf());
            sample.set("serverSampleId", 473);
            sample.set("waterbodyName", "local update");
            sample.set("updatedAt", moment("2020-05-01").valueOf());
            sample.save();
            await createSampleDownloader().downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("local update");

        });
        it('should overwrite local updates if they have been updated on the server', async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            // if updated_at < serverSyncTime then do not overwrite local changes
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    updated_at: moment("2020-06-01").format()
                })]);
            let sample = makeSampleData({});
            sample.set("serverSyncTime", moment("2020-04-01").valueOf());
            sample.set("serverSampleId", 473);
            sample.set("waterbodyName", "local update");
            sample.set("updatedAt", moment("2020-05-01").valueOf());
            sample.save();
            await createSampleDownloader().downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name"); // we have server changes not local changes

        });
        it('should NOT update existing samples if the update on the server happened BEFORE our lastest upload', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData()]);

            // create existing sample to update
            let sample = makeSampleData({
                serverSampleId: 473,
                serverSyncTime: moment().add(1, "days").valueOf(), // in the future 
                waterbodyName: "existing waterbody name"
            })
            sample.save();

            await createSampleDownloader().downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("existing waterbody name");
        });
        it('should overwrite user changes with server updates if the update occured AFTER the last upload', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData()]);
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("serverSyncTime", 1); // a long time ago
            sample.set("waterbodyName", "existing waterbody name");
            sample.set("updatedAt", moment().valueOf()); // updated but NOT uploaded....
            sample.save();

            await createSampleDownloader().downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name");

        });
        it('should download site photos if they are new', async function() {
            let siteMock =  Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/spec/resources/site-mock.jpg");
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    photos: [{"id": 1948}]
                })]);
            Alloy.Globals.CerdiApi.retrieveSitePhoto = function(serverSampleId,photoPath){
                siteMock.copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve({"id": 1948});
            };                             
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");
            await createSampleDownloader().downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            // checking the site photo id proves the code was run
            expect(sample.get("serverSitePhotoId")).to.equal(1948);
            // resolve the stored path the same way production does (loadPhoto →
            // absolutePath) and compare content; getSitePhoto now returns a
            // relative name, not an absolute path.
            let siteMockBlob = siteMock.read();
            let photoBlob = loadPhoto(sample.getSitePhoto());
            expect(siteMockBlob.length).to.equal(photoBlob.length);

        });

        it('should keep going (download taxa photos) when the site photo fetch fails', async function() {
            // Regression: downloadSitePhoto's catch used to return undefined,
            // which then crashed downloadCreaturePhotos when it destructured
            // [sample, serverSample] from undefined. The chain must survive
            // a 404 on the site photo and still process the taxa photos.
            let creatureMock = {
                id: 1948,
                photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/spec/resources/simpleKey1/media/amphipoda_01.jpg"),
            };
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    photos: [{ "id": 1948 }],
                    sampled_creatures: [{
                        "id": 2390,
                        "sample_id": 473,
                        "creature_id": 1,
                        "count": 2,
                        "photos_count": 0
                    }]
                })]);
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSitePhoto")
                .rejectWith({ message: "HTTP error" });
            Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId, creatureId, photoPath) {
                creatureMock.photo.copy(Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve(creatureMock);
            };

            await createSampleDownloader().downloadSamples();

            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            let taxon = sample.loadTaxa().at(0);
            expect(taxon.get("serverCreaturePhotoId")).to.equal(creatureMock.id);
        });

        it('should download taxa photos if they are new',async function() {
            // TODO: Make sure the temporary photo is filed into the correct
            // place.
            let creatureMocks = [
                {
                    id: 1948,
                    photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_01.jpg"),
                },{
                    id: 2600,
                    photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_02.jpg")
                }];
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    sampled_creatures: [
                        {
                            "id": 2390,
                            "sample_id": 473,
                            "creature_id": 1,
                            "count": 2,
                            "photos_count": 0
                        },
                        {
                            "id": 2391,
                            "sample_id": 473,
                            "creature_id": 2,
                            "count": 6,
                            "photos_count": 0
                        }
                    ]
                })]);
            Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId,creatureId,photoPath ) {
                let mockCreature = creatureMocks[creatureId-1];
                mockCreature.photo.copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve(mockCreature);
            };                                
            
            await createSampleDownloader().downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            let taxa  = sample.loadTaxa();
            function verifyTaxon(i) {
                let taxon = taxa.at(i);
                expect(taxon.get("serverCreaturePhotoId")).to.equal(creatureMocks[i].id);
                let expectedBlob = creatureMocks[i].photo.read();
                let actualBlob = loadPhoto(taxon.getPhoto());
                expect(expectedBlob.length).to.equal(actualBlob.length);
            }
            // checking the site photo id proves the code was run
            verifyTaxon(0);
            verifyTaxon(1);

        });

        it('should retry a creature photo that failed to download on an earlier sync', async function() {
            // WB-101: a transient photo-download failure (e.g. marginal network)
            // must not strand the photo. The sample stays pending so a later
            // sync re-fetches it, rather than being marked fully synced with a
            // null taxonPhotoPath that is never retried.
            let creatureMock = {
                id: 1948,
                photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/spec/resources/simpleKey1/media/amphipoda_01.jpg"),
            };
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    sampled_creatures: [{
                        "id": 2390,
                        "sample_id": 473,
                        "creature_id": 1,
                        "count": 2,
                        "photos_count": 0
                    }]
                })]);

            let networkUp = false;
            Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId, creatureId, photoPath) {
                if ( !networkUp ) return Promise.reject({ message: "HTTP error" });
                creatureMock.photo.copy(Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve(creatureMock);
            };

            // First sync: the photo fetch fails, so the photo stays pending.
            await createSampleDownloader().downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.loadTaxa().at(0).get("taxonPhotoPath"), "photo pending after failed fetch").to.be.null;

            // Second sync once the network recovers: the photo must be retried.
            networkUp = true;
            await createSampleDownloader().downloadSamples();
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.loadTaxa().at(0).get("serverCreaturePhotoId"), "photo recovered on retry").to.equal(creatureMock.id);
        });


        // Due to protocol error early on it is possible for habitat data to be incorrectly blank
        // on the server, if somehow we download corrupt habitat data, make sure any correct data
        // is merged into the new record and the updatedAt is correctly set to re-trigger an upload.
        it('should not overwrite habitat with blanks', async function() {
            let sampleData = makeCerdiSampleData({
                habitat: {
                    boulder: 5,
                    gravel: 6,
                    wood: 9,
                    sand_or_silt: null,
                    leaf_packs: null,
                    aquatic_plants: null,
                    open_water: null,
                    edge_plants: null
                }
            });
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([sampleData]);
            // create existing sample to update
            let sample = makeSampleData({
                serverSampleId:  473,
                serverSyncTime:  1, // a long time ago
                waterbodyName:  "existing waterbody name",
                sandOrSilt:  7,
                leafPacks:  8,
                aquaticPlants:  10,
                openWater:  11,
                edgePlants:  12,
                updatedAt:  moment().valueOf(), // updated but NOT uploaded....
            });
            sample.save();

            await createSampleDownloader().downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.createModel("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name");
            expect(sample.get("boulder")).to.equal(5);
            expect(sample.get("gravel")).to.equal(6);
            expect(sample.get("sandOrSilt")).to.equal(7);
            expect(sample.get("leafPacks")).to.equal(8);
            expect(sample.get("wood")).to.equal(9);
            expect(sample.get("aquaticPlants")).to.equal(10);
            expect(sample.get("openWater")).to.equal(11);
            expect(sample.get("edgePlants")).to.equal(12);

            // This should be true to indicate data needs to be reuploaded
            // after the blanks have been filled in.
            expect(sample.get("updatedAt")).to.be.above(sample.get("serverSyncTime"));
        });
        /* not possible photos to change on server currently.. 
        it('should update site photo if changed on server');
        it('should update creature photos if changed on server');*/
        it('should download more than one sample',async function() {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                .resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith([makeCerdiSampleData({
                    id:234,
                    waterbody_name: "first test sample"
                }),
                makeCerdiSampleData({
                    id:235,
                    waterbody_name: "second test sample"
                })]);
            await createSampleDownloader().downloadSamples();
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(234);
            expect(sample.get("serverSampleId")).to.equal(234);
            expect(sample.get("waterbodyName")).to.equal("first test sample");
            sample.loadByServerId(235);
            expect(sample.get("serverSampleId")).to.equal(235);
            expect(sample.get("waterbodyName")).to.equal("second test sample");
        });

        it('keeps processing remaining samples when one sample download fails', async function() {
            // A transient failure on one sample (e.g. 429 after retries exhausted,
            // server error fetching unknown creatures) must not strand the rest
            // of the queue. The failing sample stays pending so a later sync
            // retries it.
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUnknownCreatures")
                .callFn((serverSampleId) => {
                    if (serverSampleId === 235) {
                        return Promise.reject(new Error("HTTP 503"));
                    }
                    return Promise.resolve([]);
                });
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples")
                .resolveWith([
                    makeCerdiSampleData({ id: 234, waterbody_name: "first" }),
                    makeCerdiSampleData({ id: 235, waterbody_name: "doomed" }),
                    makeCerdiSampleData({ id: 236, waterbody_name: "third" }),
                ]);

            await createSampleDownloader().downloadSamples();

            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(234);
            expect(sample.get("serverSampleId"), "first sample persisted").to.equal(234);
            expect(sample.get("serverSyncTime"), "first sample marked synced").to.be.a("number");

            sample = Alloy.createModel("sample");
            sample.loadByServerId(236);
            expect(sample.get("serverSampleId"), "third sample persisted after failed second").to.equal(236);
            expect(sample.get("serverSyncTime"), "third sample marked synced after failed second").to.be.a("number");

            sample = Alloy.createModel("sample");
            sample.loadByServerId(235);
            expect(sample.get("serverSyncTime"), "failed sample left pending for retry").to.not.be.a("number");
        });

    });

    it('should not duplicate record if edited whilst uploading', async function() {
        clearMockSampleData();
        let sample = makeSampleData( { 
            sitePhotoPath: makeTestPhoto("site.jpg"),
            dateCompleted:  moment().valueOf(),
            sampleServerId: 666,
        });
        sample.save(); 
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
            .returnWith(38);
        simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto").resolveWith({id:1});
        simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:666});
        
        let tempSample = sample.createTemporaryForEdit();
        tempSample.set("waterbodyName", "edited");

        // upload original sample
        await createSampleUploader().uploadSamples();

        // SHOULD only upload the old record NOT the
        // record being currently edited.
        expect(Alloy.Globals.CerdiApi.submitSample.callCount, "submitSample call count").to.equal(1);

        // save the editted copy
        await tempSample.saveCurrentSample();

        // see if the original still exists
        let samples = Alloy.createCollection("sample");
        samples.fetch({
            query: 'SELECT * FROM sample'
        });
        expect(samples.length,"samples.length").equals(1);
        expect(samples.at(0).get("waterbodyName")).equals("edited");
        expect(samples.at(0).get("serverSampleId")).equals(666);
    }),

    it('should not duplicate record when download is available after an edit', async function() {
        clearMockSampleData();
        let sample = makeSampleData( { 
            sitePhotoPath: makeTestPhoto("site.jpg"),
            dateCompleted:  moment("2020-01-01").valueOf(),
            serverSampleId: 666,
            serverSyncTime: moment("2020-01-01").valueOf()
        });
        sample.save(); 

        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
            .returnWith(38);
        simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
            .resolveWith({id:1});
        simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:666});    
        simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
            .resolveWith([makeCerdiSampleData({id: 666, updated_at: "2020-01-02"})]);
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
            .resolveWith([]);
 
        expect(sample.get("serverSampleId"),"smaple.serverSampleId").to.equal(666)
        let tempSample = sample.createTemporaryForEdit();
        tempSample.set("waterbodyName", "edited");
        
        expect(tempSample.get("dateCompleted")).to.be.undefined;
        expect(tempSample.get("serverSampleId")).to.equal(666); 
        
       
        // save the edited copy
        await Promise.all([tempSample.saveCurrentSample(), createSampleDownloader().downloadSamples()]); 
        //await createSampleDownloader().downloadSamples();
        // see if the original still exists
        let samples = Alloy.createCollection("sample");
        samples.fetch({
            query: 'SELECT * FROM sample'
        });
        expect(samples.length,"samples.length").equals(1);
        
       
    });

    it('should not duplicate taxons when taxons are downloaded after an update', async function() {
        clearMockSampleData();
        let creatureMocks = [
            {
                id: 1948,
                photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_01.jpg"),
            },{
                id: 2600,
                photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_02.jpg")
            }];
            
        simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
            .resolveWith([makeCerdiSampleData({
                sampled_creatures: [
                    {
                        "id": 2390,
                        "sample_id": 473,
                        "creature_id": 1,
                        "count": 2,
                        "photos_count": 0
                    },
                    {
                        "id": 2391,
                        "sample_id": 473,
                        "creature_id": 2,
                        "count": 6,
                        "photos_count": 0
                    }
                ]
            })]);
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
            .resolveWith([]);
        Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId,creatureId,photoPath ) {
            if ( creatureId > creatureMocks.length ) {
                throw new Error("mock download error - no such model");
            }
            let mockCreature = creatureMocks[creatureId-1];
            mockCreature.photo.copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
            return Promise.resolve(mockCreature);
        };    

        // need to fake being logged in or else sync operation fails
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
            .resolveWith(true);
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
            .returnWith(38);
        
        await createSampleDownloader().downloadSamples();   

        let sample = Alloy.createModel("sample");
        sample.loadByServerId(473);
        sample.set("serverSyncTime", moment("2020-01-01").valueOf());
        sample.save();

        // simulate an edit in the server
        simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
            .resolveWith([makeCerdiSampleData({
                updated_at: moment("2020-01-02").valueOf(),
                sampled_creatures: [
                    {
                        "id": 2390,
                        "sample_id": 473,
                        "creature_id": 1,
                        "count": 2,
                        "photos_count": 0
                    },
                    {
                        "id": 2391,
                        "sample_id": 473,
                        "creature_id": 2,
                        "count": 6,
                        "photos_count": 0
                    }
                ]
            })]);
        await createSampleDownloader().downloadSamples(); 

        let taxa = sample.loadTaxa();
        expect(taxa.size()).to.equal(2);
        

    });

    it('should not attempt to download photos that do not exist on the server', async function() {
        clearMockSampleData();
        // example exists and has been uploaded
        // sample is edited, a taxon has been added 
        // samples are then uploaded - this triggers a download
        // the download attempts to find server photos 
        // for new taxons but fails due to these taxons have never been uploaded
        // this test check tests that the download fialure doesn't freeze the process 
        let creatureMocks = [
            {
                id: 1948,
                photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_01.jpg"),
            },{
                id: 2600,
                photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_02.jpg")
            }];
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
            .resolveWith([]);
        simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
            .resolveWith([makeCerdiSampleData({
                sampled_creatures: [
                    {
                        "id": 2390,
                        "sample_id": 473,
                        "creature_id": 1,
                        "count": 2,
                        "photos_count": 0
                    },
                    {
                        "id": 2391,
                        "sample_id": 473,
                        "creature_id": 2,
                        "count": 6,
                        "photos_count": 0
                    }
                ]
            })]);
        Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId,creatureId,photoPath ) {
            if ( creatureId > creatureMocks.length ) {
                throw new Error("mock download error - no such model");
            }
            let mockCreature = creatureMocks[creatureId-1];
            mockCreature.photo.copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
            return Promise.resolve(mockCreature);
        };    
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
            .returnWith(38);
        simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
               .resolveWith({id:473});
        simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
            .resolveWith({id:1});
        simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
            .resolveWith({id:2})
            .resolveWith({id:3});
        
        await createSampleDownloader().downloadSamples();   

        // at this point we should have a sample in the database
        // simulate adding a new taxon
        let sample = Alloy.createModel("sample");
        sample.loadByServerId(473);
        let tempSample = sample.createTemporaryForEdit();
        Alloy.createModel("taxa",{ 
            sampleId:  tempSample.get("sampleId"),
            taxonId: 99, 
            abundance: "> 20",
            taxonPhotoPath: makeTestPhoto("taxon-98.jpg"),
            updatedAt: 0
            }).save();
        // sample is submitted
        tempSample.saveCurrentSample();
       
        await waitForTick(10)();
        // need to fake being logged in or else sync operation fails
        simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
               .resolveWith(true);
        await SampleSync.forceSync({delay:0, noschedule:true});
        

        // should upload sample and new photo
        expect(Alloy.Globals.CerdiApi.updateSampleById.callCount,"updateSampleById").to.equal(1);
        expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount,"submitCreaturePhoto").to.equal(1);
        expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.calls[0].args[1]).to.equal(99);



    })

    describe("Unknown bugs", function() {
        it("should upload unknown bugs with a new record", async function() {
            clearMockSampleData();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
            simple.mock(Alloy.Globals.CerdiApi,"submitUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]})
                .resolveWith({id:2,photos:[{id:100}]});
            
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), 
                abundance: "1-2", updatedAt: 0
            });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), 
                abundance: "3-5", updatedAt: 0 
            });
            taxon2.save();
            
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitSample.callCount).to.equal(1);
            let creatures = Alloy.Globals.CerdiApi.submitSample.calls[0].args[0].creatures;
            expect(creatures, "no unknown creatures included in creatures").to.be.empty;
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount, "should not call submitCreaturePhoto for unknown creatures").to.equal(0);
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.callCount,"submitUnknownCreature").to.equal(2);
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.calls[0].args[1],"submitUnknownCreature[0] count").to.equal(2);
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.calls[1].args[1],"submitUnknownCreature[1] count").to.equal(4);
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.calls[0].args[2],"submitUnknownCreature[0] photoPath").to.include("taxon.jpg");
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.calls[1].args[2],"submitUnknownCreature[1] photoPath").to.include("taxon2.jpg");
        });
        it("should download any unknown bugs", async function() {
            clearMockSampleData();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);

                let unknownCreatureMockPhoto = 
                    {
                        id: 4146,
                        photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_01.jpg"),
                    };
                simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                    .resolveWith([makeCerdiSampleData({
                        sampled_creatures: []
                    })]);

                simple.mock(Alloy.Globals.CerdiApi,"retrieveUnknownCreatures")
                    .resolveWith(
                        [
                            {
                                "count": 6,
                                "creature_id": null,
                                "id": 3113,
                                "photos": [
                                    {
                                        "id": 4146
                                    }
                                ]
                            }
                        ]
                    );
                simple.mock(Alloy.Globals.CerdiApi,"retrievePhoto")
                  .callFn(function(photoId,photoPath ) {
                    Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/spec/resources/simpleKey1/media/amphipoda_01.jpg")
                        .copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                    return Promise.resolve({id: photoId});
                });
                await createSampleDownloader().downloadSamples();
                expect(Alloy.Globals.CerdiApi.retrieveUnknownCreatures.callCount, "should call retrieveUnknownCreatures").to.equal(1);
                expect(Alloy.Globals.CerdiApi.retrievePhoto.callCount,"should call retrievePhoto").to.equal(1);
                expect(Alloy.Globals.CerdiApi.retrievePhoto.calls[0].args[0],"retrievePhoto[0] photoId").to.equal(4146);

                let sample = Alloy.Models.instance("sample");
                sample.loadByServerId(473);
                let taxa  = sample.loadTaxa();
                
                expect( taxa.size()).to.equal(1);
                let unknownTaxon = taxa.at(0);
                
                expect(unknownTaxon.get("taxonId"),"taxonId").to.be.null;
                expect(unknownTaxon.get("serverCreaturePhotoId")).to.be.equal(4146);
                expect(unknownTaxon.get("taxonPhotoPath"),"taxonPhotoPath").to.include("unknown");
                expect(unknownTaxon.get("abundance")).to.be.equal("6-10");
                expect(unknownTaxon.get("serverCreatureId")).to.be.equal(3113);
        });
        it("should upload any added unknown bugs", async function() {
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            clearMockSampleData();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
            simple.mock(Alloy.Globals.CerdiApi,"submitUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]})
                .resolveWith({id:2,photos:[{id:100}]});
            simple.mock(Alloy.Globals.CerdiApi,"updateUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]})
                .resolveWith({id:2,photos:[{id:100}]});
            
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"),
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), abundance: "1-2", 
                updatedAt: 0 
            });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), abundance: "3-5",
                updatedAt: 0 
            });
            taxon2.save();
            
            await createSampleUploader().uploadSamples();
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.callCount, "should call retrieveUnknownCreatures").to.equal(2);
            

            simple.mock(Alloy.Globals.CerdiApi,"submitUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]})
                .resolveWith({id:2,photos:[{id:100}]});
            let taxon3 = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"),
                 taxonPhotoPath: makeTestPhoto("taxon3.jpg"), abundance: "6-10",
                 updatedAt: 0 
            });
            taxon3.save();

            // force a re-upload
            sample.loadById( sample.get("sampleId"))
            sample.save();

            Alloy.Globals.CerdiApi.updateSampleById.callCount = 0;
            Alloy.Globals.CerdiApi.submitUnknownCreature.callCount = 0;

            await createSampleUploader().uploadSamples();

            expect(Alloy.Globals.CerdiApi.updateSampleById.callCount, "updateSampleId call count").to.equal(1);
            let creatures = Alloy.Globals.CerdiApi.updateSampleById.calls[0].args[1].creatures;
            expect(creatures, "no unknown creatures included in creatures").to.be.empty;
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount, "should not call submitCreaturePhoto for unknown creatures").to.equal(0);
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.callCount,"submitUnknownCreature").to.equal(1);
            
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.calls[0].args[1],"submitUnknownCreature[0] count").to.equal(8);
         });

        it("should upload any edited existing unknown bugs", async function() {
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:666});
            clearMockSampleData();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto");
            simple.mock(Alloy.Globals.CerdiApi,"updateUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]})
                .resolveWith({id:2,photos:[{id:100}]});

          
            simple.mock(Alloy.Globals.CerdiApi,"submitUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]})
                .resolveWith({id:2,photos:[{id:100}]});
            
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"),
                 taxonPhotoPath: makeTestPhoto("taxon.jpg"), abundance: "1-2", 
                 updatedAt: 0 });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                taxonId: null, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), abundance: "3-5",
                updatedAt: 0 });
            taxon2.save();
            
            await createSampleUploader().uploadSamples();  
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.callCount, "should call retrieveUnknownCreatures").to.equal(2);

            Alloy.Globals.CerdiApi.submitUnknownCreature.callCount = 0;

            // force a re-upload
            sample.loadById( sample.get("sampleId") )
            sample.set("serverSyncTime", moment("2020-01-01").valueOf()); 
            sample.set("updatedAt", moment().valueOf());
            sample.save();

            await createSampleUploader().uploadSamples();  

            expect(Alloy.Globals.CerdiApi.updateSampleById.callCount,"updateSampleById should be called").to.equal(1);
            let creatures = Alloy.Globals.CerdiApi.updateSampleById.calls[0].args[1].creatures;
            expect(creatures, "no unknown creatures included in creatures").to.be.empty;
            expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount, "should not call submitCreaturePhoto for unknown creatures").to.equal(0);
            expect(Alloy.Globals.CerdiApi.submitUnknownCreature.callCount,"submitUnknownCreature").to.equal(0);
            expect(Alloy.Globals.CerdiApi.updateUnknownCreature.callCount,"updateUnknownCreature").to.equal(2);
         });

        // Needs to send DELETE requests for any unknown bugs that have been
        // removed. 
    
        // We don't actually delete the taxon but simply mark it deleted with a flag. 
        // That way if willDelete == true then we call DELETE on the unknown then actually 
        // remove the taxon during upload.
        it("should remove any removed unknown bugs", async function() {

            clearMockSampleData();
            simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
                .returnWith(38);
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:123, user_id:38});
            simple.mock(Alloy.Globals.CerdiApi,"submitSitePhoto")
                .resolveWith({id:1});
            simple.mock(Alloy.Globals.CerdiApi,"submitCreaturePhoto")
            simple.mock(Alloy.Globals.CerdiApi,"updateUnknownCreature")
                .resolveWith({id:1,photos:[{id:99}]});
            simple.mock(Alloy.Globals.CerdiApi,"deleteUnknownCreature")
                .resolveWith();
            
            let sample = makeSampleData();
            sample.save(); 
            let taxon = Alloy.createModel("taxa", { 
                serverCreatureId: 1, taxonId: null, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon.jpg"), abundance: "1-2",
                updatedAt: 0 
            });
            taxon.save();
            let taxon2 = Alloy.createModel("taxa", { 
                serverCreatureId: 2, taxonId: null, sampleId: sample.get("sampleId"), 
                taxonPhotoPath: makeTestPhoto("taxon2.jpg"), abundance: "3-5",
                updatedAt: 0 
            });
            taxon2.save();
            
            // delete the taxon
            taxon2.flagForDeletion();
            await createSampleUploader().uploadSamples();

            expect(Alloy.Globals.CerdiApi.deleteUnknownCreature.callCount, "should call deleteUnknownCreature").to.equal(1);
            expect(Alloy.Globals.CerdiApi.deleteUnknownCreature.calls[0].args[0], "unknownCreatureId").to.equal(2);

            // check that the taxon has actaully been removed
            sample.loadByServerId(473);
            let taxa  = sample.loadTaxa();
            expect(taxa.size()).to.equal(1);


        });
    })

    context("WB-8: upload / full-sync separation", function () {
        const FULL_SYNC_PENDING_KEY = "fullSyncPending";

        function mockLoggedIn() {
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUserToken").returnWith({ accessToken: "tok" });
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUserId").returnWith(38);
        }

        function mockUploadEndpoints() {
            simple.mock(Alloy.Globals.CerdiApi, "submitSample").resolveWith({ id: 123, user_id: 38 });
            simple.mock(Alloy.Globals.CerdiApi, "submitSitePhoto").resolveWith({ id: 1 });
        }

        function queueNewSample() {
            makeSampleData().save();
        }

        this.beforeEach(function () {
            clearMockSampleData();
            Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, false);
        });

        this.afterEach(function () {
            Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, false);
            simple.restore();
        });

        it("forceSync downloads then uploads", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();

            await SampleSync.forceSync({ delay: 0, noschedule: true });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(1);
            expect(Alloy.Globals.CerdiApi.submitSample.callCount, "submitSample (upload)").to.equal(1);
        });

        it("uploadPending uploads without downloading", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();

            await SampleSync.uploadPending({ delay: 0, noschedule: true });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(0);
            expect(Alloy.Globals.CerdiApi.submitSample.callCount, "submitSample (upload)").to.equal(1);
        });

        it("resumeInterruptedWork resumes a pending full sync (downloads)", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();
            Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, true);

            await SampleSync.resumeInterruptedWork({ delay: 0, noschedule: true });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(1);
        });

        it("resumeInterruptedWork flushes queued uploads only when no full sync is pending", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();

            await SampleSync.resumeInterruptedWork({ delay: 0, noschedule: true });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(0);
            expect(Alloy.Globals.CerdiApi.submitSample.callCount, "submitSample (upload)").to.equal(1);
        });

        it("resumeInterruptedWork does nothing when there is no pending work", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);

            await SampleSync.resumeInterruptedWork({ delay: 0, noschedule: true });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(0);
            expect(Alloy.Globals.CerdiApi.submitSample.callCount, "submitSample (upload)").to.equal(0);
        });

        it("clears the pending-full-sync flag on success but keeps it when the sync fails", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();

            await SampleSync.forceSync({ delay: 0, noschedule: true });
            expect(Ti.App.Properties.getBool(FULL_SYNC_PENDING_KEY), "flag after success").to.equal(false);

            // A failed download leaves the intent set so it resumes later (WB-8 resilience).
            simple.restore();
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").rejectWith(new Error("network blip"));
            queueNewSample();

            await SampleSync.forceSync({ delay: 0, noschedule: true });
            expect(Ti.App.Properties.getBool(FULL_SYNC_PENDING_KEY), "flag after failure").to.equal(true);
        });

        it("resumes a pending full sync when the network comes back up", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, true);

            await SampleSync.networkChanged({ networkType: Ti.Network.NETWORK_WIFI });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(1);
        });

        it("does not start a sync when the network drops", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();
            Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, true);

            await SampleSync.networkChanged({ networkType: Ti.Network.NETWORK_NONE });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "retrieveSamples (download)").to.equal(0);
        });

        it("runs the download before reporting success when a full sync is requested mid-upload", async function () {
            mockLoggedIn();
            mockUploadEndpoints();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            queueNewSample();
            // Mimics forceSync bailing on the isSyncing guard mid-upload: the
            // intent flag is set while an upload-only sync is in flight.
            Ti.App.Properties.setBool(FULL_SYNC_PENDING_KEY, true);

            await SampleSync.uploadPending({ delay: 0, noschedule: true });

            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "download ran before success").to.equal(1);
            expect(Ti.App.Properties.getBool(FULL_SYNC_PENDING_KEY), "flag cleared once the full sync ran").to.equal(false);
        });

        it("emits no info-level log line for an idle sync with nothing to do", async function () {
            mockLoggedIn();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            const Logger = require("util/Logger");
            const captured = [];
            const unsubscribe = Logger.subscribe({ facility: "sync", minLevel: "info" }, (e) => captured.push(e.message));

            await SampleSync.forceSync({ delay: 0, noschedule: true });
            unsubscribe();

            expect(captured, "info-level sync log").to.deep.equal([]);
        });

        it("logs a one-line summary when a sync actually moves data", async function () {
            mockLoggedIn();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUnknownCreatures").resolveWith([]);
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([makeCerdiSampleData({ user_id: 38 })]);
            const Logger = require("util/Logger");
            const captured = [];
            const unsubscribe = Logger.subscribe({ facility: "sync", minLevel: "info" }, (e) => captured.push(e.message));

            await SampleSync.forceSync({ delay: 0, noschedule: true });
            unsubscribe();

            expect(captured, "summary line").to.include("Sync finished: downloaded 1, uploaded 0");
        });

        it("countSamplesNeedingUpload counts only samples still needing upload, not the whole history", function () {
            mockLoggedIn();
            // fully-synced: uploaded, synced after its last edit, site photo up
            makeSampleData({
                serverSampleId: 999,
                serverSitePhotoId: 5,
                updatedAt: moment("2020-01-01").valueOf(),
                serverSyncTime: moment("2020-02-01").valueOf(),
            }).save();
            expect(SampleSync.countSamplesNeedingUpload(), "synced sample excluded").to.equal(0);

            // a fresh sample whose site photo hasn't uploaded → needs upload
            makeSampleData().save();
            expect(SampleSync.countSamplesNeedingUpload(), "one pending").to.equal(1);
        });
    })

    // The sync-recommended badge used to be set blindly on login and only
    // cleared by a full sync. The probe answers "does the server have changes
    // we don't, or do we have local uploads pending?" cheaply enough to run on
    // login + the existing 30-min timer, so the badge becomes truthful.
    context("WB-114: sync-needed probe", function () {
        function mockLoggedIn() {
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUserToken").returnWith({ accessToken: "tok" });
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUserId").returnWith(38);
        }

        this.beforeEach(function () {
            clearMockSampleData();
        });

        this.afterEach(function () {
            simple.restore();
        });

        it("returns true when there are pending uploads, without touching the server", async function () {
            mockLoggedIn();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);
            // A fresh sample with a site photo has a pending upload.
            makeSampleData({ sitePhotoPath: makeTestPhoto("site.jpg") }).save();

            const needed = await SampleSync.checkSyncNeeded();

            expect(needed, "needed").to.equal(true);
            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "skips the server probe").to.equal(0);
        });

        it("returns true when the server has a sample newer than local", async function () {
            mockLoggedIn();
            // local copy synced a while ago; server says it was updated later
            makeSampleData({
                serverSampleId: 473,
                serverSitePhotoId: 5,
                serverSyncTime: moment("2020-01-01").valueOf(),
                updatedAt: moment("2020-01-01").valueOf(),
            }).save();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([
                makeCerdiSampleData({ id: 473, updated_at: moment("2020-06-01").format() }),
            ]);

            expect(await SampleSync.checkSyncNeeded()).to.equal(true);
        });

        it("returns false when nothing is pending locally and the server has no newer copies", async function () {
            mockLoggedIn();
            makeSampleData({
                serverSampleId: 473,
                serverSitePhotoId: 5,
                serverSyncTime: moment("2020-06-01").valueOf(),
                updatedAt: moment("2020-01-01").valueOf(),
            }).save();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([
                makeCerdiSampleData({ id: 473, updated_at: moment("2020-05-01").format() }),
            ]);

            expect(await SampleSync.checkSyncNeeded()).to.equal(false);
        });

        it("returns true when the server has a sample the device has never seen", async function () {
            mockLoggedIn();
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([
                makeCerdiSampleData({ id: 999, updated_at: moment("2020-06-01").format() }),
            ]);

            expect(await SampleSync.checkSyncNeeded()).to.equal(true);
        });

        it("returns undefined when not logged in (state untouched)", async function () {
            simple.mock(Alloy.Globals.CerdiApi, "retrieveUserToken").returnWith(null);
            simple.mock(Alloy.Globals.CerdiApi, "retrieveSamples").resolveWith([]);

            const needed = await SampleSync.checkSyncNeeded();

            expect(needed, "no answer when not logged in").to.equal(undefined);
            expect(Alloy.Globals.CerdiApi.retrieveSamples.callCount, "no API call").to.equal(0);
        });
    });
});
