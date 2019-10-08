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
var { use, expect } = require("unit-test/lib/chai");
var { makeTestPhoto } = require("unit-test/util/TestUtils");
var { loadPhoto, needsOptimising } = require('util/PhotoUtils');
var { createCerdiApi } = require("unit-test/mocks/MockCerdiApi");
use( require('unit-test/lib/chai-date-string') );


Alloy.Globals.CerdiApi = createCerdiApi();

var SampleSync = require('logic/SampleSync');

describe("SampleSync", function() {
    it("should resize photos if they are too large", async function() {
        Alloy.Globals.CerdiApi.photosSubmitted = [];
        Alloy.Collections.sample = null;
        Alloy.Collections.taxa = null;
        Alloy.Models.sample = null;
        Alloy.Models.taxa = null;
        let samples = Alloy.Collections.instance("sample");
        let taxa = Alloy.Collections.instance("taxa");
        
        let sample = Alloy.createModel("sample", { serverSampleId: 666, sitePhotoPath: makeTestPhoto("site.jpg") });
        sample.save();

        let taxon = Alloy.createModel("taxa", { sampleId: sample.get("sampleId"), taxonPhotoPath: makeTestPhoto("taxon.jpg") });
        taxa.add(taxon);
        
        taxon.save();
        samples.add(sample);
        console.log(`existing api? = ${JSON.stringify(Alloy.Globals.CerdiApi)}`)
        await SampleSync.uploadNextSample(samples);
        expect(Alloy.Globals.CerdiApi.photosSubmitted.length).to.equal(2);

        function expectPhotoOptimised(path) {
            var photo = loadPhoto(path);
            expect( needsOptimising(photo ) ).to.be.false;
            expect( photo.length ).to.be.below( 4*1014*1024 );
            expect( photo.width ).to.be.at.most( 1600 );
            expect( photo.height ).to.be.at.most( 1200 );
        }

        var sitePhoto = loadPhoto(Alloy.Globals.CerdiApi.photosSubmitted[0]);
        expectPhotoOptimised(Alloy.Globals.CerdiApi.photosSubmitted[0]);
        expectPhotoOptimised(Alloy.Globals.CerdiApi.photosSubmitted[1]);
    });
});
