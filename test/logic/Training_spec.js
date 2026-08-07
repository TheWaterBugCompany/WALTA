require("mocha");
const { expect } = require("chai");
const createTraining = require("logic/Training");

// In-memory stand-ins for the collaborators Training composes.
function fakeTopics() {
  const fired = [];
  return {
    TRAINING_STARTED: "trainingstarted",
    fireTopicEvent(t, data) { fired.push({ t, data }); },
    fired,
  };
}

function fakeExercises(map) {
  return { loadExercise: (code) => map[String(code)] || null };
}

// A tray that just records what the repo added, standing in for the domain
// SampleTray (the real one is exercised in its own spec).
function fakeTray() {
  return { taxa: [], get length() { return this.taxa.length; } };
}

function fakeRepo(tray) {
  return {
    started: null,
    startSession(code) { this.started = code; return tray; },
  };
}

describe("logic/Training", function () {
  let topics, tray, repo, exercises, training;

  beforeEach(function () {
    topics = fakeTopics();
    tray = fakeTray();
    repo = fakeRepo(tray);
    exercises = fakeExercises({ "101": [90, 198, 176, 131] });
    training = createTraining({ topics, repo, exercises });
  });

  it("starts a session for a known code and announces the tray + assessor on the bus", function () {
    const started = training.startTraining("101");

    expect(started).to.equal(true);
    expect(repo.started).to.equal("101");
    expect(topics.fired).to.have.length(1);
    const { t, data } = topics.fired[0];
    expect(t).to.equal(topics.TRAINING_STARTED);
    expect(data.tray).to.equal(tray);
    expect(data.training).to.equal(true);
  });

  it("builds the assessor from the exercise's expected order", function () {
    training.startTraining("101");
    const { assessor } = topics.fired[0].data;
    const verdicts = assessor.assess([
      { taxonId: 90, sampleTaxonId: 1 },
      { taxonId: 999, sampleTaxonId: 2 },
    ]);
    expect(verdicts).to.deep.equal({ 1: "correct", 2: "incorrect" });
  });

  it("refuses an unknown code — no session, no event", function () {
    const started = training.startTraining("999");

    expect(started).to.equal(false);
    expect(repo.started).to.equal(null);
    expect(topics.fired).to.have.length(0);
  });

  it("reports whether a session is active", function () {
    expect(training.isActive()).to.equal(false);
    training.startTraining("101");
    expect(training.isActive()).to.equal(true);
  });
});
