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


function createTestLogin() {
    // make sure our test user is registered for tests that
    // require it.
    return CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET ).registerUser( {
        email: `testlogin@example.com`,
        group: false,
        survey_consent: false,
        share_name_consent: false,
        name: 'Test Example',
        password: 'tstPassw0rd!'
    }).catch( (err)=> {
        // Ignore failures
    });
}

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
describe('#retrieveSamples', function () {
    let cerdi;
    before(createTestLogin);

    beforeEach( function() {
        mockTiWithProxy();
        cerdi = CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET );
    });

    const sitePhotoPath = "/unit-test/resources/site-mock.jpg";
    const creaturePhotoPath = "/unit-test/resources/simpleKey1/media/amphipoda_01.jpg";
    function submitSitePhoto(serverSampleId) {
        return cerdi.submitSitePhoto(serverSampleId, sitePhotoPath)
    }
    function submitCreaturePhoto(serverSampleId, creatureId) {
        return cerdi.submitSitePhoto(serverSampleId, creatureId, creaturePhotoPath)
    }
    function submitTestSample() {
        return cerdi.submitSample(MOCK_SAMPLE_DATA)
    }
    

    it.only("should retrieve site photo", function () {
        this.timeout(5000);
        let serverSampleId, sitePhotoId, creaturePhotoId;
        return cerdi
            .loginUser('testlogin@example.com', 'tstPassw0rd!')
            .then(() => submitTestSample())
            .then(res => serverSampleId = res.id)
            .then(() => submitSitePhoto(serverSampleId))
            .then(res => sitePhotoId = res.id)
            .then(() => cerdi.retrieveSitePhoto(serverSampleId))
            .then(res => assertLooksSame(sitePhotoPath, res.path));

    });
});
