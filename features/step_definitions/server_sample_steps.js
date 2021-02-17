const { Given, When, Then } = require('cucumber');
const { assertLooksSame, diffImages } = require('../support/image-test');

const { expect } = require("chai");

Given('I have existing samples stored on the server', {timeout: 60000}, async function () {
    global.mockCerdiServer.makeMockSample();
    await this.menu.login( "test@example.com", "password" )
    await this.menu.waitFor();
});

// FIXME: this test relies on a fixed device resolution (Pixel 2 XL ) - should either
// scale images to normalised size or record an image on each device resolution.
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
    await assertLooksSame(path.join(__dirname,'../../test-resources/expected_site_photo.png'),'/tmp/sitePhoto.png');

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

    await this.sample.openTaxon(12);
    await this.editTaxon.saveTaxonPhoto("/tmp/taxon12photo.png");
    await assertLooksSame(path.join(__dirname,'../../test-resources/expected_taxon12_photo.png'),'/tmp/taxon12photo.png');

    await this.editTaxon.close();

    await this.sample.openTaxon(11);
    await this.editTaxon.saveTaxonPhoto("/tmp/taxon11photo.png");
    await assertLooksSame(path.join(__dirname,'../../test-resources/expected_taxon11_photo.png'),'/tmp/taxon11photo.png');

    await this.editTaxon.close();



});

When('the server becomes reachable', function() {
/* # its always reachable */
});