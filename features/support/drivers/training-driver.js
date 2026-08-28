'use strict';
// Shared training-session flows for both the cucumber acceptance suite
// (training_steps.js) and the Mocha e2e specs. Drivers take `world` and drive
// cross-screen flows; single-screen actions stay on the screen page-objects.
//
// The training identification path deliberately ends differently from a real
// survey: training adds via `taxon.addToTrainingSample()` (no photo/save),
// whereas a survey uses `taxon.selectAddToSample()` + camera + save (see
// survey-driver.addTaxonViaKeyToSample). That routing distinction is exactly
// what the training tests exist to protect, so it stays explicit here.

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
// A correction does not start at the root: "Which question did I get wrong?"
// drops the reader at the couplet the limpet and mussel paths part at, which is
// the one the first question above leads to.
const MUSSEL_FROM_HINT = MUSSEL.slice(1);

// Enter the academy exercise code and start the session (leaves the caller on
// the empty training tray). The academy-screen navigation is the caller's, so
// this maps 1:1 onto the cucumber "I start the training session" step.
async function startTrainingSession(world, code = "999") {
    await world.academy.enterCode(code);
    await world.academy.waitForStartAvailable();
    await world.academy.start();
}

// Walk the key to a taxon and add it to the training tray cell the caller names
// (the tray is numbered, and the number carries the position through the key).
// keySearch.choose waits for the screen to settle before tapping, so each tap
// lands on a fully transitioned (interactive) screen — no retries.
async function identifyTrainingTaxonViaKey(world, questions, cell) {
    await world.sample.selectCell(cell);
    await world.methodSelect.viaKey();
    await chooseThroughKeyToTraining(world, questions);
}

// Re-open an already-graded taxon the assessor flagged wrong: the comparison
// explains it, and its follow-up reopens the key at the couplet that went wrong
// — so the corrected walk starts there rather than at the root.
async function reidentifyTrainingTaxonViaKey(world, taxonId, questions) {
    await world.sample.openComparison(taxonId);
    await world.taxonComparison.whichQuestion();
    await chooseThroughKeyToTraining(world, questions);
}

async function chooseThroughKeyToTraining(world, questions) {
    for (const q of questions) await world.keySearch.choose(q);
    await world.taxon.waitFor();
    await world.taxon.addToTrainingSample();
}

// The full exercise-999 correction session: identify a gastropod, mis-identify a
// limpet, assess (flags the limpet), re-identify it as a mussel, assess again
// (now correct), and finish on the success screen.
async function completeTrainingSession(world) {
    await world.menu.selectAcademy();
    await startTrainingSession(world, "999");
    await identifyTrainingTaxonViaKey(world, GASTROPOD, 1);
    await identifyTrainingTaxonViaKey(world, LIMPET, 2);
    await world.sample.assess();
    await reidentifyTrainingTaxonViaKey(world, 184, MUSSEL_FROM_HINT);   // 184 = the wrong Ancylidae
    await world.sample.assess();
    await world.trainingSuccess.waitFor();
    await world.trainingSuccess.finish();
}

exports.GASTROPOD = GASTROPOD;
exports.LIMPET = LIMPET;
exports.MUSSEL_FROM_HINT = MUSSEL_FROM_HINT;
exports.startTrainingSession = startTrainingSession;
exports.identifyTrainingTaxonViaKey = identifyTrainingTaxonViaKey;
exports.chooseThroughKeyToTraining = chooseThroughKeyToTraining;
exports.completeTrainingSession = completeTrainingSession;
