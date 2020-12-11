const { Given, When, Then } = require('cucumber');
const { assertLooksSame, diffImages } = require('../support/image-test');
const { makeCerdiSampleData } = require('../../walta-app/app/assets/unit-test/fixtures/SampleData_fixture.js');
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
Given('I have existing samples stored on the server', {timeout: 60000}, async function () {
    let accessToken = "testusertoken";
    // set up user account responses
    global.hockServer
        .post("/token/create",{
            "password":"password",
            "email":"test@example.com"
        })
        .reply(200,{
            "id": 38,
            "name": "Test Example",
            "email": "testlogin@example.com",
            "created_at": "2018-09-07 08:55:30",
            "updated_at": "2018-09-07 08:55:30",
            "group": 0,
            "survey_consent": 0,
            "share_name_consent": 0,
            "oauth_network": null,
            "accessToken": accessToken
        });
    // set up samples response
    let sampleData = makeCerdiSampleData({
        photos: [{"id": 1}],
        sampled_creatures: [
            {
                "sample_id": 473,
                "creature_id": 12,
                "count": 2,
                "photos_count": 1
            },
            {
                "sample_id": 473,
                "creature_id": 11,
                "count": 6,
                "photos_count": 1
            }
        ]
    });
    global.hockServer
        .get("/samples")
        .reply(200,[sampleData]);
    global.hockServer
        .get(`/samples/${sampleData.id}/photos`)
        .reply(200,[{id:1}]);
    global.hockServer
        .get('/photos/1/view')
        .replyWithFile(200, path.join(__dirname,'../../walta-app/app/assets/unit-test/resources/site-mock.jpg'));
    global.hockServer
        .get(`/samples/${sampleData.id}/creatures/12/photos`)
        .reply(200,[{id:2}]);
    global.hockServer
        .get(`/samples/${sampleData.id}/creatures/11/photos`)
        .reply(200,[{id:3}]);    
    global.hockServer
        .get('/photos/2/view')
        .replyWithFile(200, path.join(__dirname,'../../walta-app/app/assets/unit-test/resources/simpleKey1/media/amphipoda_01.jpg'));
    global.hockServer
        .get('/photos/3/view')
        .replyWithFile(200, path.join(__dirname,'../../walta-app/app/assets/unit-test/resources/simpleKey1/media/phreatoicidae.jpg'));
    await this.menu.login( "test@example.com", "password" )
    await this.menu.waitFor();
});

Then('the new samples are downloaded to the phone', {timeout: 60000}, async function() {
    
    await this.menu.selectArchive();
    let waterbodyName = await this.archive.getWaterbodyName();
    expect(waterbodyName).to.equal("test waterbody name");
    let uploaded = await this.archive.getUploaded();
    expect(uploaded).to.equal("Yes");
    let dateCompleted = await this.archive.getDateCompleted();
    expect(dateCompleted).to.equal("25/Sep/2020 7:41:46 pm");

    await this.archive.clickRow();

    let waterbodyNameSiteScreen = await this.siteDetails.getWaterbodyName();
    expect(waterbodyNameSiteScreen).to.equal("test waterbody name");

    let nearbyFeature = await this.siteDetails.getNearbyFeature();
    expect(nearbyFeature).to.equal("test nearby feature");

    let surveyLevel = await this.siteDetails.getSurveyLevel();
    expect(surveyLevel).to.equal("Detailed");

    let waterbodyType = await this.siteDetails.getWaterbodyType();
    expect(waterbodyType).to.equal("River");

    let location = await this.siteDetails.getLocation();
    expect(location).to.equal("37.5622\u00B0S 143.8750\u00B0E");

    await this.siteDetails.saveSitePhoto("/tmp/sitePhoto.png");
    assertLooksSame(path.join(__dirname,'../../test-resources/expected_site_photo.png'),'/tmp/sitePhoto.png');

    await this.siteDetails.goNext();

    let leafPacks = await this.habitat.getLeafPacks();
    expect(leafPacks).to.equal("16");

    let boulders = await this.habitat.getBoulders();
    expect(boulders).to.equal("17");

    let aqauticPlants = await this.habitat.getAquaticPlants();
    expect(aqauticPlants).to.equal("14");

    let gravel = await this.habitat.getGravel();
    expect(gravel).to.equal("13");

    let wood = await this.habitat.getWood();
    expect(wood).to.equal("11");

    let sandOrSilt = await this.habitat.getSandOrSilt();
    expect(sandOrSilt).to.equal("9");

    let edgePlants = await this.habitat.getEdgePlants();
    expect(edgePlants).to.equal("8");

    let openWater = await this.habitat.getOpenWater();
    expect(openWater).to.equal("12");

    await this.habitat.goNext();



});

When('the server becomes reachable', function() {
/* # its always reachable */
});