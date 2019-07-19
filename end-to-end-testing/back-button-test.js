describe('Back button tests', function() {
    it('should return to menu when back pressed on the root of a key', async function() {
        await world.menu.identify();
        await world.methodSelect.viaKey();
        await world.keySearch.chooseTopAndExpect("Animals look like snails or limpets");
        await world.keySearch.goBack();
        await world.keySearch.waitForText("Animal with a shell");
        await world.keySearch.goBack();
        await world.menu.waitFor();
    });

    it('should return to browse list when back pressed on key search via browse', async function() {
        await world.menu.identify();
        await world.methodSelect.viaBrowse();
        await world.browse.chooseSpecies("Adult Baetidae");
        await world.taxon.waitFor();
        expect( await world.taxon.getHeading() ).to.equal("Baetids");
        await world.taxon.goBack();
        await world.browse.waitFor();
    });

    it('should return to browse list when right swipe on key search via browse', async function() {
        await world.menu.identify();
        await world.methodSelect.viaBrowse();
        await world.browse.chooseSpecies("Adult Baetidae");
        await world.taxon.waitFor();
        expect( await world.taxon.getHeading() ).to.equal("Baetids");
        await swipeRight();
        await world.browse.waitFor();
    });

    it('should return to key when right swipe on key search', async function() {
        await world.menu.identify();
        await world.methodSelect.viaKey();
        await world.keySearch.chooseTopAndExpect("Animals look like snails or limpets");
        await swipeRight();
        await world.keySearch.waitForText("Animal with a shell");
    });
});