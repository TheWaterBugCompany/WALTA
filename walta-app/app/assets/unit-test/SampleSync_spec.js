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
var moment = require("lib/moment");
var { use, expect } = require("unit-test/lib/chai");
var { makeTestPhoto, removeDatabase, resetSample, clearDatabase } = require("unit-test/util/TestUtils");
var { loadPhoto, needsOptimising } = require('util/PhotoUtils');
var { createCerdiApi } = require("unit-test/mocks/MockCerdiApi");

use(require('unit-test/lib/chai-date-string'));


Alloy.Globals.CerdiApi = createCerdiApi();

var Sample = require("logic/Sample");
var SampleSync = require('logic/SampleSync');

var MOCK_SAMPLE_DATA = {
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
    "sampled_creatures": [
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
    ],
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
};

function clearMockSampleData() {
    clearDatabase();
    Alloy.Globals.CerdiApi.photosSubmitted = [];
    Alloy.Globals.CerdiApi.sampleData = [];
    Alloy.Collections.sample = null;
    Alloy.Collections.taxa = null;
    Alloy.Models.sample = null;
    Alloy.Models.taxa = null;
}

describe("SampleSync", function () {
    it("should resize photos if they are too large", async function () {
        clearMockSampleData();
        let samples = Alloy.Collections.instance("sample");
        let taxa = Alloy.Collections.instance("taxa");

        let sample = Alloy.createModel("sample", { serverSampleId: 666, sitePhotoPath: makeTestPhoto("site.jpg") });
        sample.save();

        let taxon = Alloy.createModel("taxa", { sampleId: sample.get("sampleId"), taxonPhotoPath: makeTestPhoto("taxon.jpg") });
        taxa.add(taxon);

        taxon.save();
        samples.add(sample);

        await SampleSync.uploadNextSample(samples);
        expect(Alloy.Globals.CerdiApi.photosSubmitted.length).to.equal(2);

        function expectPhotoOptimised(path) {
            var photo = loadPhoto(path);
            expect(needsOptimising(photo)).to.be.false;
            expect(photo.length).to.be.below(4 * 1014 * 1024);
            expect(photo.width).to.be.at.most(1600);
            expect(photo.height).to.be.at.most(1200);
        }

        var sitePhoto = loadPhoto(Alloy.Globals.CerdiApi.photosSubmitted[0]);
        expectPhotoOptimised(Alloy.Globals.CerdiApi.photosSubmitted[0]);
        expectPhotoOptimised(Alloy.Globals.CerdiApi.photosSubmitted[1]);
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
    it('should upload new samples to server');
    it('should upload modified samples to the server');
    it('should ensure server updates should take priority over local updates');
    it('should upload new site photos');
    it('should upload new taxon photos');
    it('should not upload old photos again');
    it('should upload failed photos uploads again');

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
            Alloy.Globals.CerdiApi.sampleData = [MOCK_SAMPLE_DATA];
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
            Alloy.Globals.CerdiApi.sampleData = [MOCK_SAMPLE_DATA];
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("uploaded", 1); // a long time ago
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
        it('should NOT update existing samples if the update on the server happened BEFORE our lastest upload', async function () {
            Alloy.Globals.CerdiApi.sampleData = [MOCK_SAMPLE_DATA];
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("uploaded", moment().add(1, "days").valueOf()); // in the future 
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
            Alloy.Globals.CerdiApi.sampleData = [MOCK_SAMPLE_DATA];
            let samples = Alloy.Collections.instance("sample");
            let taxa = Alloy.Collections.instance("taxa");

            // create existing sample to update
            let sample = Alloy.Models.instance("sample");
            sample.set("serverSampleId", 473);
            sample.set("uploaded", 1); // a long time ago
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
        it('should download site photos if they are new',function() {

        });
        it('should download taxa photos if they are new');
    });
});
