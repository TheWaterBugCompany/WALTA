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
    this.timeout(18000);
    
    describe.skip('should return to menu when back pressed on the root of a key', async function() {
        before( startAppium );
        after( stopAppium );
        it('should go to the key', async function() {
            await navigateKeyViaIdentify( world, ["Animal with a shell"]);
            await world.keySearch.waitForText("Animals look like snails or limpets.");
        });
        it('should then go back to the menu', async function() {
            await world.keySearch.goBack();
            await world.keySearch.waitForText("Animal with a shell");
            await world.keySearch.goBack();
            await world.menu.waitFor();
        });
    });

    // broken on iOS
    describe.skip('should return to browse list when back pressed on taxon details via browse', async function() {
        before( startAppium );
        after( stopAppium );
        it('should open taxon details from browse', async function() {
            await navigateBrowseViaIdentify( world );
            await world.taxon.waitForText("'U' bent midges");
        });
        it('should return to browse', async function() {
            await world.taxon.goBack();
            await world.browse.waitFor();
        });
    });

    describe('should go back from each page of the survey wizard', async function() {
        before( startAppium );
        after( stopAppium );
        it('should go to site details', async function() {
            await world.menu.selectWaterbugSurvey();
        });
        it('should go back to menu', async function() {
            await world.siteDetails.goBack();
            await world.menu.waitFor();
            await world.menu.selectWaterbugSurvey();
        });

        it('should go to habitat screen', async function() {
            
            await world.siteDetails.selectDetailed();
            await world.siteDetails.selectRiver();
            await world.siteDetails.setWaterbodyName("a");
            await world.siteDetails.goNext();
        });

        it('should go back to site details', async function() {
            await world.habitat.goBack();
            await world.siteDetails.goNext();
        });

        it('should go to sample tray', async function() {
            await world.habitat.setSandOrSilt("100");
            await world.habitat.goNext();
        });

        it('should go back to habitat', async function() {
            await world.sample.goBack();
            await world.habitat.goNext();
        });

        it('should go back and forth from the sample tray and screen screen', async function() {
            await world.sample.goNext();
            await world.summary.goBack();
        });
    });
 
    describe.skip('should return to speedbug when returning from taxon via identify', async function() {
        before( startAppium );
        after( stopAppium );
        it('should open taxon details via speedbug', async function() {
            await navigateSpeedbugViaIdentify( world, "hyriidae" );
            await world.taxon.waitForText("Freshwater mussels");
        });
        it('should return to speed bug', async function() {
            await world.taxon.goBack();
            await world.speedbug.waitFor();
        });
    } );

    describe.skip('should return to speedbug when returning from question via identify', async function() {
        before( startAppium );
        after( stopAppium );
        it('should open key search via speedbug', async function() {
            await navigateSpeedbugNotSureViaIdentify( world, "k_bivalvia" );
            await world.keySearch.waitForText("Shell halves are large");
        });
        it('should return to speed bug', async function() {
            await world.keySearch.goBack();
            await world.speedbug.waitFor();
        });
    }  );

    describe.skip('should return to speedbug when returning from taxon via sample tray', async function() {
        before( startAppium );
        after( stopAppium );
        it('should open taxon details via speedbug via sample tray', async function() {
            await navigateSpeedbugViaTray( world, "hyriidae" );
            await world.taxon.waitForText("Freshwater mussels");
        });
        it('should return to speed bug', async function() {
            await world.taxon.goBack();
            await world.speedbug.waitFor();
        });
        // on IOS there is no back from this screen!
        it.skip('should return to sample tray on back',  async function() {
            await navigateGoBack(world);
            await world.sample.waitFor();
        });
    });

   /* describe.skip('should return to speedbug when returning from question via sample tray', async function() {
        before( startAppium );
        after( stopAppium );
        it('............', async function() {
            await navigateSpeedbugNotSureViaTray( world, "k_bivalvia" );
            await world.taxon.waitForText("Shell halves are large");
            await navigateGoBack(world);
            await world.speedbug.waitFor();
            await navigateGoBack(world);
            await world.sample.waitFor();
        });
    });

    describe.skip('should return to list when returning from taxon via sample tray', async function() {
        before( startAppium );
        after( stopAppium );
        it('............', async function() {
            await navigateSpeedbugViaIdentify( world, "hyriidae" );
            await world.taxon.waitForText("Freshwater mussels");
            await world.taxon.goBack();
            await world.speedbug.waitFor();
        });
    });*/

    describe.skip('should return to key when returning from gallery',async function() {
        before( startAppium );
        after( stopAppium );
        it('should open key search via key', async function() {
            await world.menu.selectIdentify();
            await world.methodSelect.viaKey();
            await world.keySearch.waitForText("Animal with a shell");
        });
        it('should open gallery', async function() {
            await world.keySearch.goMagnifyTop();
        });
        it('should return to key search', async function() {
            await world.gallery.close();
            await world.keySearch.waitFor();
        });
    });

    describe.skip('should return to taxon when returning from gallery',async function() {
        before( startAppium );
        after( stopAppium );
        it('should open taxon details via speedbug via sample tray', async function() {
            await navigateSpeedbugViaIdentify( world, "hyriidae" );
            await world.taxon.waitForText("Freshwater mussels");
        });
        it('should open gallery', async function() {
            await world.taxon.goMagnifyTop();
        });
        it('should return to taxon', async function() {
            await world.gallery.close();
            await world.taxon.waitFor();
        });
    });

    describe.skip('should return to edit taxon when returning from gallery',async function() {
        before( startAppium );
        after( stopAppium );
        it('should open edit taxon', async function() {
            await navigateSpeedbugViaTray( world, "hyriidae" );
            await world.taxon.waitForText("Freshwater mussels");
            await world.taxon.selectAddToSample();
        });
        it('should take a photo', async function() {
            await navigateTakePhoto(world);
            await world.editTaxon.waitFor();
        });
        it('should open gallery', async function() {
            await world.editTaxon.goMagnify();
        });
        it('should return to taxon', async function() {
            await world.gallery.close();
            await world.editTaxon.waitFor();
        });
    });

});