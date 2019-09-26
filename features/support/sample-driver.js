
 
   
async function startSurvey(world) {
    await world.menu.waitFor();
    await world.menu.selectWaterbugSurvey();
    await world.siteDetails.selectDetailed();
    await world.siteDetails.selectRiver();
    await world.siteDetails.setWaterbodyName("a");
    await world.siteDetails.goNext();
    await world.habitat.setSandOrSilt("100");
    await world.habitat.goNext();
}

async function addTaxonViaSpeedBug( world, refId ) {
    await world.sample.waitFor();
    await world.sample.selectAddSample();
    await world.methodSelect.viaSpeedbug();
    await world.speedbug.chooseSpeedbug(refId);
    await world.taxon.selectAddToSample();

}

async function submitSample(world) {
    await world.sample.goNext();
    await world.summary.submit();
}

exports.startSurvey = startSurvey;
exports.addTaxonViaSpeedBug = addTaxonViaSpeedBug;
exports.submitSample = submitSample;