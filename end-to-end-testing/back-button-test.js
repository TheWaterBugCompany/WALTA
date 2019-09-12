const { navigateGoBack,
        navigateBrowseViaTray,
        navigateSpeedbugNotSureViaTray, 
        navigateSpeedbugViaTray, 
        navigateKeyViaIdentify, 
        navigateBrowseViaIdentify, 
        navigateSpeedbugViaIdentify, 
        navigateSpeedbugNotSureViaIdentify,
        navigateTakePhoto } = require('../features/support/navigation-driver');

describe('Back button tests', function() {
    it('should return to menu when back pressed on the root of a key', async function() {
        await navigateKeyViaIdentify( world, ["Animal with a shell"]);
        await world.keySearch.waitForText("Animals look like snails or limpets.");
        await navigateGoBack(world);
        await world.keySearch.waitForText("Animal with a shell");
        await world.keySearch.goBack();
        await world.menu.waitFor();
    });

    it('should return to browse list when back pressed on taxon details via browse', async function() {
        let start = Date.now();
        await navigateBrowseViaIdentify( world );
        await world.taxon.waitForText("'U' bent midges");
        await navigateGoBack(world);
        await world.browse.waitFor();
    });

    it('should return to browse list when right swipe on taxon details via browse', async function() {
        await navigateBrowseViaIdentify( world );
        await world.taxon.waitForText("'U' bent midges");
        await swipeRight( { start_x: 4 });
        await world.browse.waitFor();
    });

    it('should go back with a right swipe from survey wizard', async function() {
        await world.menu.selectWaterbugSurvey();
        await swipeRight();
        await world.menu.waitFor();

        await world.menu.selectWaterbugSurvey();
        await world.siteDetails.selectDetailed();
        await world.siteDetails.selectRiver();
        await world.siteDetails.setWaterbodyName("a");

        await world.siteDetails.goNext();
        await world.habitat.waitFor();

        await swipeRight();
        await world.siteDetails.waitFor();
        await world.siteDetails.goNext();
        await world.habitat.waitFor();

        await world.habitat.setSandOrSilt("100");
        await world.habitat.goNext();
  
        await world.sample.waitFor();
        await swipeRight();
        await world.habitat.waitFor();
    });
 
    it('should return to speedbug when returning from taxon via identify', async function() {
        await navigateSpeedbugViaIdentify( world, "hyriidae" );
        await world.keySearch.waitForText("Freshwater mussels");
        await navigateGoBack(world);
        await world.speedbug.waitFor();
    } );

    it('should return to speedbug when returning from question via identify', async function() {
        await navigateSpeedbugNotSureViaIdentify( world, "k_bivalvia" );
        await world.taxon.waitForText("Shell halves are large");
        await navigateGoBack(world);
        await world.speedbug.waitFor();
    }  );

    it('should return to speedbug when returning from taxon via sample tray', async function() {
        await navigateSpeedbugViaTray( world, "hyriidae" );
        await world.taxon.waitForText("Freshwater mussels");
        await navigateGoBack(world);
        await world.speedbug.waitFor();
        await navigateGoBack(world);
        await world.sample.waitFor();
    });

    it('should return to speedbug when returning from question via sample tray', async function() {
        await navigateSpeedbugNotSureViaTray( world, "k_bivalvia" );
        await world.taxon.waitForText("Shell halves are large");
        await navigateGoBack(world);
        await world.speedbug.waitFor();
        await navigateGoBack(world);
        await world.sample.waitFor();
    });

    it('should return to list when returning from taxon via sample tray', async function() {
        await navigateSpeedbugViaIdentify( world, "hyriidae" );
        await world.taxon.waitForText("Freshwater mussels");
        await world.taxon.goBack();
        await world.speedbug.waitFor();
    });

    it('should return to key when returning from gallery',async function() {
        await world.menu.selectIdentify();
        await world.methodSelect.viaKey();
        await world.keySearch.waitForText("Animal with a shell");
        await world.keySearch.goMagnifyTop();
        await navigateGoBack(world);
        await world.keySearch.waitFor();
    });

    it('should return to taxon when returning from gallery',async function() {
        await navigateSpeedbugViaIdentify( world, "hyriidae" );
        await world.taxon.waitForText("Freshwater mussels");
        await world.taxon.goMagnify();
        await navigateGoBack(world);
        await world.taxon.waitFor();
    });

    // relies on having a specific camera app installed so fails on real devices
    it.skip('should return to edit taxon when returning from gallery',async function() {
        await navigateSpeedbugViaTray( world, "hyriidae" );
        await world.taxon.waitForText("Freshwater mussels");
        await world.taxon.selectAddToSample();
        await navigateTakePhoto(world);
        await world.editTaxon.waitFor();
        await world.editTaxon.goMagnify();
        await navigateGoBack(world);
        await world.editTaxon.waitFor();
    });

});