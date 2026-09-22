const { When, Then } = require('@cucumber/cucumber');
const {
  FLATWORM, LEECH, WORM_FROM_HINT, DAMSELFLY, MAYFLY, WRONG_LEECH,
  startTrainingSession,
  identifyTrainingTaxonViaKey,
  chooseThroughKeyToTraining,
} = require('../support/drivers/training-driver');

When('I start my next training course', async function () {
  await startTrainingSession(this);
});

Then('an empty training tray is shown', async function () {
  await this.sample.waitForEmptyTray();
});

When('I identify a flatworm through the key', async function () {
  await identifyTrainingTaxonViaKey(this, FLATWORM, 1);
});

// The deliberate mistake: a leech where the course expects a worm. The two part
// company at one couplet, which is the one the follow-up hint reopens at.
When('I mistake a leech for a worm through the key', async function () {
  await identifyTrainingTaxonViaKey(this, LEECH, 2);
});

When('I identify a damselfly through the key', async function () {
  await identifyTrainingTaxonViaKey(this, DAMSELFLY, 3);
});

When('I identify a mayfly through the key', async function () {
  await identifyTrainingTaxonViaKey(this, MAYFLY, 4);
});

When('I assess the training tray', async function () {
  await this.sample.assess();
});

Then('an incorrect taxon is highlighted', async function () {
  await this.sample.waitForVerdict('incorrect');
});

When('I select the incorrect taxon', async function () {
  await this.sample.openComparison(WRONG_LEECH);
});

Then('the comparison shows the worm beside the leech I chose', async function () {
  await this.taxonComparison.waitForText('Hirudinea');
  await this.taxonComparison.waitForText('Oligochaeta');
});

When('I tap the leech photo in the comparison', async function () {
  await this.taxonComparison.openTaxon('Hirudinea');
});

Then('the leech details are shown', async function () {
  await this.taxon.waitFor();
  await this.taxon.waitForText('Hirudinea');
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
When('I choose the worm instead', async function () {
  await chooseThroughKeyToTraining(this, WORM_FROM_HINT);
});

Then('the training success screen is shown', async function () {
  await this.trainingSuccess.waitFor();
});

When('I finish the training', async function () {
  await this.trainingSuccess.finish();
});
