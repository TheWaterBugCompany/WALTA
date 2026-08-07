require("mocha");
const { expect } = require("chai");
const { Navigation } = require("../../walta-app/app/lib/logic/Navigation");

function fakeTopics() {
  const subs = {};
  return {
    SURVEY_STARTED: "surveystarted",
    TRAINING_STARTED: "trainingstarted",
    subscribe(t, cb) { (subs[t] = subs[t] || []).push(cb); },
    fire(t, data) { (subs[t] || []).forEach((cb) => cb(data)); },
  };
}

// A training session announces its tray/assessor on TRAINING_STARTED; Navigation
// seeds itself from the bus and threads them (plus a training flag) through args
// the same way it threads a survey's sample/taxa — so training screens receive the
// domain aggregate by injection. A survey and a training session are mutually
// exclusive, so establishing one clears the other's threaded refs.
describe("Navigation training threading", function () {
  let opened, topics, services, nav;

  beforeEach(function () {
    opened = [];
    topics = fakeTopics();
    services = {
      Key: { url: "k" },
      Survey: { name: "survey" },
      topics,
      View: { openView(ctl, args) { opened.push({ ctl, args }); return Promise.resolve(); } },
    };
    nav = new Navigation(services);
  });

  it("threads the tray+assessor+training flag announced on TRAINING_STARTED into an opened controller's args", function () {
    const tray = { length: 0 };
    const assessor = { assess() {} };
    topics.fire(topics.TRAINING_STARTED, { tray, assessor, training: true });

    nav.onOpenView("SampleTray", { slide: "none" });

    expect(opened[0].args.tray).to.equal(tray);
    expect(opened[0].args.assessor).to.equal(assessor);
    expect(opened[0].args.training).to.equal(true);
    expect(opened[0].args.key).to.equal(services.Key);
  });

  it("clears any survey sample when a training session starts (mutually exclusive)", function () {
    topics.fire(topics.SURVEY_STARTED, { sample: { id: 1 }, taxa: { length: 2 } });
    topics.fire(topics.TRAINING_STARTED, { tray: { length: 0 }, assessor: {}, training: true });

    nav.onOpenView("SampleTray", {});

    expect(opened[0].args.sample).to.equal(null);
    expect(opened[0].args.taxa).to.equal(null);
    expect(opened[0].args.training).to.equal(true);
  });

  it("clears any training session when a survey starts (mutually exclusive)", function () {
    topics.fire(topics.TRAINING_STARTED, { tray: { length: 0 }, assessor: {}, training: true });
    topics.fire(topics.SURVEY_STARTED, { sample: { id: 1 }, taxa: { length: 2 } });

    nav.onOpenView("SiteDetails", {});

    expect(opened[0].args.training).to.equal(false);
    expect(opened[0].args.tray).to.equal(null);
    expect(opened[0].args.assessor).to.equal(null);
    expect(opened[0].args.sample).to.deep.equal({ id: 1 });
  });
});
