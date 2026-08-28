const { When, Then } = require('@cucumber/cucumber');
const {
  GASTROPOD, LIMPET, MUSSEL_FROM_HINT,
  startTrainingSession,
  identifyTrainingTaxonViaKey,
  chooseThroughKeyToTraining,
} = require('../support/drivers/training-driver');

const WRONG_LIMPET = 184;   // Ancylidae — what the exercise expects to be corrected

When('I start the training session {string}', async function (code) {
  await startTrainingSession(this, code);
});

Then('an empty training tray is shown', async function () {
  await this.sample.waitFor();
});

When('I identify a gastropod through the key', async function () {
  await identifyTrainingTaxonViaKey(this, GASTROPOD, 1);
});

When('I identify a freshwater limpet through the key', async function () {
  await identifyTrainingTaxonViaKey(this, LIMPET, 2);
});

When('I assess the training tray', async function () {
  await this.sample.assess();
});

Then('an incorrect taxon is highlighted', async function () {
  await this.sample.waitForVerdict('incorrect');
});

When('I select the incorrect taxon', async function () {
  await this.sample.openComparison(WRONG_LIMPET);
});

Then('the comparison shows the mussel beside the limpet I chose', async function () {
  await this.taxonComparison.waitForText('Ancylidae');
  await this.taxonComparison.waitForText('Hyriidae');
});

When('I ask which question I got wrong', async function () {
  await this.taxonComparison.whichQuestion();
});

Then('the key marks the branch I should have taken', async function () {
  await this.keySearch.waitForVerdict('correct');
  await this.keySearch.waitForVerdict('incorrect');
});

// The key reopened at the couplet that went wrong, so the correction is walked
// from there rather than from the root.
When('I choose the mussel instead', async function () {
  await chooseThroughKeyToTraining(this, MUSSEL_FROM_HINT);
});

Then('the training success screen is shown', async function () {
  await this.trainingSuccess.waitFor();
});

When('I finish the training', async function () {
  await this.trainingSuccess.finish();
});
