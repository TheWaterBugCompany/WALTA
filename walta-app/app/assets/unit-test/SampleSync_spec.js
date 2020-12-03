/*
      The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("unit-test/lib/ti-mocha");
var simple = require("unit-test/lib/simple-mock");
var moment = require("lib/moment");

var { use, expect } = require("unit-test/lib/chai");
var { makeTestPhoto, removeDatabase, resetSample, clearDatabase } = require("unit-test/util/TestUtils");
var { loadPhoto, needsOptimising } = require('util/PhotoUtils');
var { createCerdiApi } = require("unit-test/mocks/MockCerdiApi");

use(require('unit-test/lib/chai-date-string'));


Alloy.Globals.CerdiApi = createCerdiApi();

var Sample = require("logic/Sample");
var Taxon = require("logic/Taxon");
var SampleSync = require('logic/SampleSync');

function makeMockSampleData(attrs) {
    return [_.extend({
        "id": 473,
        "user_id": 38,
        "sample_date": "2020-09-25T09:41:46+00:00",
        "lat": "-37.5622000",
        "lng": "143.8750300",
        "scoring_method": "alt",
        "created_at": "2020-09-25T09:41:47+00:00",
        "updated_at": "2020-09-25T09:41:47+00:00",
        "survey_type": "detailed",
        "waterbody_type": "river",
        "waterbody_name": "test waterbody name",
        "nearby_feature": "test nearby feature",
        "notes": "test sample",
        "reviewed": 0,
        "corrected": 0,
        "complete": null,
        "score": 0,
        "weighted_score": null,
        "sampled_creatures": [],
        "habitat": {
            "id": 473,
            "sample_id": 473,
            "boulder": 5,
            "gravel": 6,
            "sand_or_silt": 7,
            "leaf_packs": 8,
            "wood": 9,
            "aquatic_plants": 10,
            "open_water": 11,
            "edge_plants": 12
        },
        "photos": []
    },attrs)];
}

function clearMockSampleData() {
    clearDatabase();
    Alloy.Collections.sample = null;
    Alloy.Collections.taxa = null;
    Alloy.Models.sample = null;
    Alloy.Models.taxa = null;
}

function makeSample() {
    return Alloy.createModel("sample", { 
        serverSampleId: null, 
        lat: "-37.5622000",
        lng: "143.8750300",
        dateCompleted: moment().format(),
        accuracy: 1,
        surveyType: Sample.SURVEY_DETAILED,
        waterbodyType: Sample.WATERBODY_RIVER,
        waterbodyName: "test water body name",
        serverSyncTime: null
     });
}

describe("SampleSync", function () {
    it("should resize photos if they are too large", async function () {
        clearMockSampleData();
        
        let samples = Alloy.Collections.instance("sample");
        let taxa = Alloy.Collections.instance("taxa");

        let sample = Alloy.createModel("sample", { serverSampleId: 666, sitePhotoPath: makeTestPhoto("site.jpg") });
        sample.save();

        let taxon = Alloy.createModel("taxa", { sampleId: sample.get("sampleId"), taxonPhotoPath: makeTestPhoto("taxon.jpg"), abundance: "1-2" });
        taxa.add(taxon);

        taxon.save();
        samples.add(sample);

        simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
               .resolveWith({id:666});

        await SampleSync.uploadNextSample(samples);
        expect(Alloy.Globals.CerdiApi.submitSitePhoto.callCount).to.equal(1);
        expect(Alloy.Globals.CerdiApi.submitCreaturePhoto.callCount).to.equal(1);
        function expectPhotoOptimised(path) {
            var photo = loadPhoto(path);
            expect(needsOptimising(photo)).to.be.false;
            expect(photo.length).to.be.below(4 * 1014 * 1024);
            expect(photo.width).to.be.at.most(1600);
            expect(photo.height).to.be.at.most(1200);
        }
        expectPhotoOptimised(Alloy.Globals.CerdiApi.submitSitePhoto.lastCall.args[1]);
        expectPhotoOptimised(Alloy.Globals.CerdiApi.submitCreaturePhoto.lastCall.args[2]);
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
        
        it('should upload new samples to server',async function() {
            simple.mock(Alloy.Globals.CerdiApi,"submitSample")
                .resolveWith({id:123});
                // TODO: set up a complete sample and check all the fields
                // are mapped correctly in the submitted sample.
            let sample = makeSample();
            sample.save(); 
            await SampleSync.uploadSamples();
            sample.clear();
            sample.loadByServerId(123);
            expect(sample).to.be.ok;
            expect(sample.get("serverSampleId")).to.equal(123);
            expect(Alloy.Globals.CerdiApi.submitSample.callCount).to.equal(1);
            expect(Alloy.Globals.CerdiApi.submitSample.calls[0].args[0].waterbody_name).to.equal("test water body name");
        });
        it('should upload modified samples to the server', function(done) {
            simple.mock(Alloy.Globals.CerdiApi,"updateSampleById")
                .resolveWith({id:123});
            let sample = makeSample();
            sample.set("serverSyncTime", moment("2020-01-01").valueOf());
            sample.set("serverSampleId", 123);
            sample.set("waterbodyName", "updated"); // should set updatedAt field
            // updated on next tick do we need to call _.defer
            _.defer( () => {
                sample.save();
                SampleSync.uploadSamples()
                    .then( () => {
                        expect(Alloy.Globals.CerdiApi.updateSampleById.callCount).to.equal(1);
                        expect(Alloy.Globals.CerdiApi.updateSampleById.calls[0].args[1].waterbody_name).to.equal("updated");
                        done();
                    });
            });
        });
       
        it('should upload new site photos');
        it('should upload new taxon photos');
        it('should not upload old photos again');
        it('should upload failed photos uploads again');
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
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData({
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
                }));
                Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId,creatureId,photoPath ) {
                    Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/unit-test/resources/simpleKey1/media/amphipoda_01.jpg")
                        .copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                    return Promise.resolve({id: 1});
                };  
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");
            await SampleSync.downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
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
            expect(sample.get("boulder")).to.equal(5);
            expect(sample.get("gravel")).to.equal(6);
            expect(sample.get("sandOrSilt")).to.equal(7);
            expect(sample.get("leafPacks")).to.equal(8);
            expect(sample.get("wood")).to.equal(9);
            expect(sample.get("aquaticPlants")).to.equal(10);
            expect(sample.get("openWater")).to.equal(11);
            expect(sample.get("edgePlants")).to.equal(12);
            // check creatures
            expect(taxa.length).to.equal(2);
            expect(taxa.at(0).get("taxonId")).to.equal(1);
            expect(taxa.at(0).get("abundance")).to.equal("1-2");
            expect(taxa.at(1).get("taxonId")).to.equal(2);
            expect(taxa.at(1).get("abundance")).to.equal("6-10");
        });
        it('should update existing samples if they have been updated on the server', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData());
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("serverSyncTime", 1); // a long time ago
            sample.set("waterbodyName", "existing waterbody name");
            sample.save();

            await SampleSync.downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name");

        });
        it('should NOT update existing samples if they have been updated on the server but we have already downloaded that update', async function() {
            // if updated_at < serverSyncTime then do not overwrite local changes
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData({
                    updated_at: moment("2020-03-01").format()
                }));
            let sample = makeSample({});
            sample.set("serverSyncTime", moment("2020-04-01").valueOf());
            sample.set("serverSampleId", 473);
            sample.set("waterbodyName", "local update");
            sample.set("updatedAt", moment("2020-05-01").valueOf());
            sample.save();
            await SampleSync.downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("local update");

        });
        it('should overwrtie lcoal updates if they have been updated on the server', async function() {
            // if updated_at < serverSyncTime then do not overwrite local changes
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData({
                    updated_at: moment("2020-06-01").format()
                }));
            let sample = makeSample({});
            sample.set("serverSyncTime", moment("2020-04-01").valueOf());
            sample.set("serverSampleId", 473);
            sample.set("waterbodyName", "local update");
            sample.set("updatedAt", moment("2020-05-01").valueOf());
            sample.save();
            await SampleSync.downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name"); // we have server changes not local changes

        });
        it('should NOT update existing samples if the update on the server happened BEFORE our lastest upload', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData());
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("serverSyncTime", moment().add(1, "days").valueOf()); // in the future 
            sample.set("waterbodyName", "existing waterbody name");
            sample.save();

            await SampleSync.downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("existing waterbody name");
        });
        it('should overwrite user changes with server updates if the update occured AFTER the last upload', async function () {
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData());
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("serverSyncTime", 1); // a long time ago
            sample.set("waterbodyName", "existing waterbody name");
            sample.set("updatedAt", moment().valueOf()); // updated but NOT uploaded....
            sample.save();

            await SampleSync.downloadSamples();

            // load the updated sample - we are just testing the update is applied here
            // assuming the same code path is followed for adding a new sample
            sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            expect(sample.get("serverSampleId")).to.equal(473);
            expect(sample.get("waterbodyName")).to.equal("test waterbody name");

        });
        it('should download site photos if they are new', async function() {
            let siteMock =  Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "/unit-test/resources/site-mock.jpg");
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData({
                    photos: [{"id": 1948}]
                }));
            Alloy.Globals.CerdiApi.retrieveSitePhoto = function(serverSampleId,photoPath){
                siteMock.copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve({"id": 1948});
            };                             
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");
            await SampleSync.downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            // checking the site photo id proves the code was run
            expect(sample.get("serverSitePhotoId")).to.equal(1948);
            // check the photo path contans the correct photo - we compare file sizes 
            let sampleSitePhoto = Ti.Filesystem.getFile(sample.getSitePhoto());
            let siteMockBlob = siteMock.read();
            let photoBlob = sampleSitePhoto.read();
            expect(siteMockBlob.length).to.equal(photoBlob.length);

        });

        it('should download taxa photos if they are new',async function() {
            // TODO: Make sure the temporary photo is filed into the correct
            // place.
            let creatureMocks = [
                {
                    id: 1948,
                    photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/unit-test/resources/simpleKey1/media/amphipoda_01.jpg"),
                },{
                    id: 2600,
                    photo: Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,"/unit-test/resources/simpleKey1/media/amphipoda_02.jpg")
                }];
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(makeMockSampleData({
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
                }));
            Alloy.Globals.CerdiApi.retrieveCreaturePhoto = function(serverSampleId,creatureId,photoPath ) {
                console.log(`mock retrieveCreaturePhoto ${creatureId}`);
                let mockCreature = creatureMocks[creatureId-1];
                mockCreature.photo.copy( Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + photoPath);
                return Promise.resolve(mockCreature);
            };                                
            
            await SampleSync.downloadSamples();
            let sample = Alloy.Models.instance("sample");
            sample.loadByServerId(473);
            let taxa  = sample.loadTaxa();
            console.log(`taxa = ${JSON.stringify(taxa)}`)
            function verifyTaxon(i) {
                let taxon = taxa.at(i);
                expect(taxon.get("serverCreaturePhotoId")).to.equal(creatureMocks[i].id);
                let creaturePhoto = Ti.Filesystem.getFile(taxon.getPhoto());
                let expectedBlob = creatureMocks[i].photo.read();
                let actualBlob = creaturePhoto.read();
                expect(expectedBlob.length).to.equal(actualBlob.length);
            }
            // checking the site photo id proves the code was run
            verifyTaxon(0);
            verifyTaxon(1);

        });
        it('should download more than one sample');

        // Due to protocol error early on it is possible for habitat data to be incorrectly blank
        // on the server, if somehow we download corrupt habitat data, make sure any correct data
        // is merged into the new record and the updatedAt is correctly set to re-trigger an upload.
        it('should not overwrite habitat with blanks', function(done) {
            let sampleData = makeMockSampleData({
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
            simple.mock(Alloy.Globals.CerdiApi,"retrieveSamples")
                .resolveWith(sampleData);
            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("serverSyncTime", 1); // a long time ago
            sample.set("waterbodyName", "existing waterbody name");
            sample.set("sandOrSilt", 7);
            sample.set("leafPacks", 8);
            sample.set("aquaticPlants", 10);
            sample.set("openWater", 11);
            sample.set("edgePlants", 12);
            sample.set("updatedAt", moment().valueOf()); // updated but NOT uploaded....
            sample.save();

            SampleSync.downloadSamples()
                .then( () => {

                    // load the updated sample - we are just testing the update is applied here
                    // assuming the same code path is followed for adding a new sample
                    sample = Alloy.Models.instance("sample");
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
                    // updatedAt is set with a defer so we need to test for it
                    // afterwards
                    _.defer( () => {
                        expect(sample.get("updatedAt")).to.be.above(sample.get("serverSyncTime"));
                        done();
                    });
                });
        })
        
    });
    context('updating existing samples', function() {
        it('should update site photo if changed on server');
        it('should update creature photos if changed on server');
        it('should upload new photo if taxon photo is changed');
        it('should upload new photo if site photo is changed');
        it('should upload new sample if site photo is changed');
    })
});
