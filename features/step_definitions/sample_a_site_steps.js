const { Given, When } = require('@cucumber/cucumber');

Given('a user has arrived at a site to sample', async function () {
    await this.menu.waitFor();
});

When('the user fills out the site details', { timeout: 120000 }, async function () {
    await this.menu.selectWaterbugSurvey();
    await this.siteDetails.selectDetailed();
    await this.siteDetails.selectRiver();
    await this.siteDetails.setWaterbodyName("Test Creek");
    await this.siteDetails.setNearByFeature("Bridge");
    await this.siteDetails.selectSitePhoto();
    await this.camera.takePhoto();
    await this.siteDetails.goNext();
});

When('the user fills out the habitat screen', { timeout: 60000 }, async function () {
    // Habitat values must sum to 100% or the Next button stays disabled.
    await this.habitat.setLeafPacks("20");
    await this.habitat.setAquaticPlants("10");
    await this.habitat.setWood("10");
    await this.habitat.setEdgePlants("10");
    await this.habitat.setBoulders("10");
    await this.habitat.setGravel("10");
    await this.habitat.setSandOrSilt("20");
    await this.habitat.setOpenWater("10");
    await this.habitat.goNext();
});
