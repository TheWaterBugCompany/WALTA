const { When, Then } = require('@cucumber/cucumber');
const {
  GASTROPOD, LIMPET, MUSSEL,
  startTrainingSession,
  identifyTrainingTaxonViaKey,
  reidentifyTrainingTaxonViaKey,
} = require('../support/training-driver');

When('I start the training session {string}', async function (code) {
  await startTrainingSession(this, code);
});

Then('an empty training tray is shown', async function () {
  await this.sample.waitFor();
});

When('I identify a gastropod through the key', async function () {
  await identifyTrainingTaxonViaKey(this, GASTROPOD);
});

When('I identify a freshwater limpet through the key', async function () {
  await identifyTrainingTaxonViaKey(this, LIMPET);
});

When('I assess the training tray', async function () {
  await this.sample.assess();
});

Then('an incorrect taxon is highlighted', async function () {
  await this.sample.waitForIncorrectVerdict();
});

When('I re-identify the limpet as a mussel', async function () {
  await reidentifyTrainingTaxonViaKey(this, 184, MUSSEL);   // 184 = the wrong Ancylidae
});

Then('the training success screen is shown', async function () {
  await this.trainingSuccess.waitFor();
});

When('I finish the training', async function () {
  await this.trainingSuccess.finish();
});
