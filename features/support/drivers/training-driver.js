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

// Key question paths (verbatim from the taxonomy) for the course-101 taxa, in
// the order the exercise expects them: Turbellaria, Oligochaeta, the damselflies
// and Baetidae.
const FLATWORM = [   // Turbellaria, taxonId 198
    "Animal without a shell",
    "Animal without legs",
    "not segmented",
    "flattened, short and slimy",
];
const WORM = [   // Oligochaeta, taxonId 176
    "Animal without a shell",
    "Animal without legs",
    "segmented",
    "without suction cups",
    "without hard mouthparts",
];
const WRONG_LEECH = 175;   // Hirudinea — what the course expects to be corrected
const LEECH = [   // Hirudinea, taxonId 175 — the deliberately-wrong pick
    "Animal without a shell",
    "Animal without legs",
    "segmented",
    "with suction cups on either end of the body",
    "without a hardened head capsule",
];
// A correction does not start at the root: "Which question did I get wrong?"
// drops the reader at the couplet the leech and worm paths part at — whether
// the animal has suction cups.
const WORM_FROM_HINT = WORM.slice(3);

const DAMSELFLY = [   // Lestidae and Coenagrionidae, taxonId 131
    "Animal without a shell",
    "Animal with legs",
    "With eight legs or less",
    "with six legs",
    "with no wing covers, possibly with wing buds",
    "no obvious tails",
    "without a case",
    "with wingbuds and well developed compound eyes",
    "Identify further.",
    "Slender larvae, with 3 long tails (terminal gills). These can break off. Swim by undulating (snake-like).",
    "Identify further.",
    "Gills different in shape or orientation.",
    "Gills equal in length or longer than last 3 abdominal segments.",
    "Gills complete, without constriction.",
    "Gills leaf like.",
];
const MAYFLY = [   // Baetidae, taxonId 90
    "Animal without a shell",
    "Animal with legs",
    "With eight legs or less",
    "with six legs",
    "with no wing covers, possibly with wing buds",
    "with obvious tails. Check they are not abdominal pro-legs (like a pair of hooks on short prolegs at the end of the abdomen)",
    "with three tails",
    "without obvious wings.  may have wing buds; mostly found underwater",
    "tails thin, round in cross section",
    "Identify further.",
    "Nymphs with gills along the side of the abdomen.",
    "Not as above.",
    "Not as above head not helmet like, upper and lower gills similar.",
    "Nymphs are fast swimmers, but swim in bursts like tiny fish. Nymphs not flattened or sprawling, head bullet shaped. Tails fringed with hairs.",
    "Small nymphs less than 10mm. Antennae longer than head. Common.",
];

// Start the course the trainee's belt level says comes next (leaves the caller
// on the empty training tray). There is no code to enter: the Academy works the
// course out from the belt held. The academy-screen navigation is the caller's,
// so this maps 1:1 onto the cucumber "I start my next training course" step.
async function startTrainingSession(world) {
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

// The full course-101 correction session: identify the four creatures the
// course expects but mistake the worm for a leech, assess (flags it),
// re-identify it as a worm, assess again (now all correct), and finish on the
// success screen.
async function completeTrainingSession(world) {
    await world.menu.selectAcademy();
    await startTrainingSession(world);
    await identifyTrainingTaxonViaKey(world, FLATWORM, 1);
    await identifyTrainingTaxonViaKey(world, LEECH, 2);
    await identifyTrainingTaxonViaKey(world, DAMSELFLY, 3);
    await identifyTrainingTaxonViaKey(world, MAYFLY, 4);
    await world.sample.assess();
    await reidentifyTrainingTaxonViaKey(world, WRONG_LEECH, WORM_FROM_HINT);
    await world.sample.assess();
    await world.trainingSuccess.waitFor();
    await world.trainingSuccess.finish();
}

exports.FLATWORM = FLATWORM;
exports.WORM = WORM;
exports.LEECH = LEECH;
exports.WORM_FROM_HINT = WORM_FROM_HINT;
exports.DAMSELFLY = DAMSELFLY;
exports.MAYFLY = MAYFLY;
exports.WRONG_LEECH = WRONG_LEECH;
exports.startTrainingSession = startTrainingSession;
exports.identifyTrainingTaxonViaKey = identifyTrainingTaxonViaKey;
exports.chooseThroughKeyToTraining = chooseThroughKeyToTraining;
exports.completeTrainingSession = completeTrainingSession;
