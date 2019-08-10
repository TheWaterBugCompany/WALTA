const BaseScreen = require('./base-screen.js');

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function navigateToSampleTray( world ) {
  await world.menu.selectWaterbugSurvey();
  
  // site details
  await world.siteDetails.selectDetailed();
  await world.siteDetails.selectRiver();
  await world.siteDetails.setWaterbodyName("a");
  await world.siteDetails.goNext();

  // habitat
  await world.habitat.setSandOrSilt("100");
  await world.habitat.goNext();

  await world.sample.waitFor();
}

async function navigateKeyViaIdentify( world, questions ) {
  await world.menu.selectIdentify();
  await world.methodSelect.viaKey();
  await asyncForEach( questions, async (q) => await world.keySearch.choose(q) );
}

async function navigateKeyViaTray( world, questions ) {
  await navigateToSampleTray(world);
  await world.sample.selectAddSample();
  await world.methodSelect.viaKey();
  await asyncForEach( questions, async (q) => await world.keySearch.choose(q) );
}

async function navigateBrowseViaIdentify( world, species ) {
  await world.menu.selectIdentify();
  await world.methodSelect.viaBrowse();
  if ( species )
     await world.browse.chooseSpecies(species);
  else
    await world.browse.quickSelectFirst();
}

async function navigateBrowseViaTray( world, species ) {
  await navigateToSampleTray(world);
  await world.sample.selectAddSample();
  await world.methodSelect.viaBrowse();
  await world.browse.chooseSpecies(species);
}

async function navigateSpeedbugViaIdentify( world, refId ) {
  await world.menu.selectIdentify();
  await world.methodSelect.viaSpeedbug();
  await world.speedbug.chooseSpeedbug(refId);
}

async function navigateSpeedbugViaTray( world, refId ) {
  await navigateToSampleTray(world);
  await world.sample.selectAddSample();
  await world.methodSelect.viaSpeedbug();
  await world.speedbug.chooseSpeedbug(refId);
}

async function navigateSpeedbugNotSureViaIdentify( world, refId ) {
  await world.menu.selectIdentify();
  await world.methodSelect.viaSpeedbug();
  await world.speedbug.chooseNotSure(refId);
}

async function navigateSpeedbugNotSureViaTray( world, refId ) {
  await navigateToSampleTray(world);
  await world.sample.selectAddSample();
  await world.methodSelect.viaSpeedbug();
  await world.speedbug.chooseNotSure(refId);
}

async function navigateGoBack( world ) {
  if ( world.platform === "android" ) {
    await world.driver.pressKeyCode(4);
  } else {
    await new BaseScreen(world).click("Back");
  }
}

// assumes alrady at EditTaxon or SiteDetails screen
async function navigateTakePhoto( world ) {
  await world.photoSelect.selectCamera();
  await world.camera.takePhoto();
}

exports.navigateTakePhoto = navigateTakePhoto;
exports.navigateGoBack = navigateGoBack;
exports.navigateToSampleTray = navigateToSampleTray;
exports.navigateKeyViaIdentify = navigateKeyViaIdentify;
exports.navigateKeyViaTray = navigateKeyViaTray;
exports.navigateBrowseViaIdentify = navigateBrowseViaIdentify;
exports.navigateBrowseViaTray = navigateBrowseViaTray;
exports.navigateSpeedbugViaIdentify = navigateSpeedbugViaIdentify;
exports.navigateSpeedbugViaTray = navigateSpeedbugViaTray;
exports.navigateSpeedbugNotSureViaIdentify = navigateSpeedbugNotSureViaIdentify;
exports.navigateSpeedbugNotSureViaTray = navigateSpeedbugNotSureViaTray;