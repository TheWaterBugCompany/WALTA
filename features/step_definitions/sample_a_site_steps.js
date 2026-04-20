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
