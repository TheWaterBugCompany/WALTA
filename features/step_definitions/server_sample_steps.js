const { Given, When, Then } = require('cucumber');
const { makeCerdiSampleData } = require('../../walta-app/app/assets/unit-test/fixtures/SampleData_fixture.js');
const { expect } = require("chai");
Given('I have existing samples stored on the server', {timeout: 10000}, async function () {
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
            "accessToken": "testusertoken"
        });
    // set up samples response
    global.hockServer
        .get("/samples")
        .reply(200,[makeCerdiSampleData()]);
        
    await this.menu.login( "test@example.com", "password" )
    await this.menu.waitFor();
});

Then('the new samples are downloaded to the phone', {timeout: 10000}, async function() {
    await this.menu.selectArchive();
    let waterbodyName = await this.archive.getWaterbodyName();
    expect(waterbodyName).to.equal("test waterbody name");
    await this.archive.clickRow();
});

When('the server becomes reachable', function() {
/* # its always reachable */
});