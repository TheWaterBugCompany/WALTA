function makeCerdiSampleData(attrs) {
    return _.extend({
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
            "boulder": 17,
            "gravel": 13,
            "sand_or_silt": 9,
            "leaf_packs": 16,
            "wood": 11,
            "aquatic_plants": 14,
            "open_water": 12,
            "edge_plants": 8
        },
        "photos": []
    },attrs);
}

function makeSampleData(attrs) {
    var moment = require("lib/moment");
    var Sample = require("logic/Sample");
    var { makeTestPhoto } = require("unit-test/util/TestUtils");
    return Alloy.createModel("sample", _.extend({ 
        serverSampleId: null, 
        lat: "-37.5622000",
        lng: "143.8750300",
        dateCompleted: moment().format(),
        accuracy: 1,
        surveyType: Sample.SURVEY_DETAILED,
        waterbodyType: Sample.WATERBODY_RIVER,
        waterbodyName: "test water body name",
        serverSyncTime: null,
        nearbyFeature: "nearby feature test",
        boulder: 15,
        gravel: 14,
        sandOrSilt: 13,
        wood: 8,
        leafPacks: 17,
        aquaticPlants: 12,
        openWater: 11,
        edgePlants: 10,
        sitePhotoPath: makeTestPhoto("sitephoto.jpg")
     },attrs));
}

exports.makeCerdiSampleData = makeCerdiSampleData;
exports.makeSampleData = makeSampleData;