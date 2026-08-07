const { When, Then } = require('@cucumber/cucumber');

// Key question paths (verbatim from the taxonomy) for the exercise-999 taxa.
const GASTROPOD = [
  "Animal with a shell (snails and mussels)",
  "Animals look like snails or limpets.",
  "Order level ID Gastropoda.",
];
const LIMPET = [   // Ancylidae, taxonId 184 — the deliberately-wrong pick
  "Animal with a shell (snails and mussels)",
  "Animals look like snails or limpets.",
  "Identify further.",
  "Animals look like limpets.",
];
const MUSSEL = [   // Hyriidae, taxonId 179 — the correction
  "Animal with a shell (snails and mussels)",
  "Animals look like mussels.",
  "Class level ID. Bivalvia (mussels).",
];

async function chooseThroughKey(world, questions) {
  for (const q of questions) await world.keySearch.choose(q);
  await world.taxon.waitFor();
  await world.taxon.addToTrainingSample();
}

async function addViaKey(world, questions) {
  await world.sample.selectAddSample();
  await world.methodSelect.viaKey();
  await chooseThroughKey(world, questions);
}

When('I start the training session {string}', async function (code) {
  await this.academy.enterCode(code);
  await this.academy.waitForStartAvailable();
  await this.academy.start();
});

Then('an empty training tray is shown', async function () {
  await this.sample.waitFor();
});

When('I identify a gastropod through the key', async function () {
  await addViaKey(this, GASTROPOD);
});

When('I identify a freshwater limpet through the key', async function () {
  await addViaKey(this, LIMPET);
});

When('I assess the training tray', async function () {
  await this.sample.assess();
});

Then('an incorrect taxon is highlighted', async function () {
  await this.sample.waitForIncorrectVerdict();
});

When('I re-identify the limpet as a mussel', async function () {
  await this.sample.reidentifyTaxon(184);   // tap the wrong Ancylidae
  await this.methodSelect.viaKey();
  await chooseThroughKey(this, MUSSEL);
});

Then('the training success screen is shown', async function () {
  await this.trainingSuccess.waitFor();
});

When('I finish the training', async function () {
  await this.trainingSuccess.finish();
});
