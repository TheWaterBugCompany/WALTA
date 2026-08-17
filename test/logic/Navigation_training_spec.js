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

// Navigation holds no training state: training mode rides through each transition
// as an args parameter (like a URL query), so a screen is in training mode only
// when it is opened with training:true. A finished session therefore cannot leak
// into a later survey — there is nothing stored to go stale — and the session's
// tray/assessor are threaded in by the caller (from their owner, the Training
// service) rather than injected here.
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

  it("passes a caller's training flag + tray/assessor straight through in args", function () {
    const tray = { length: 0 };
    const assessor = { assess() {} };

    nav.onOpenView("SampleTray", { training: true, tray, assessor });

    expect(opened[0].args.training).to.equal(true);
    expect(opened[0].args.tray).to.equal(tray);
    expect(opened[0].args.assessor).to.equal(assessor);
    expect(opened[0].args.key).to.equal(services.Key);
  });

  it("does not carry training mode into a screen opened without it — no ambient state to leak", function () {
    // A training session was under way and its tray was opened in training mode.
    topics.fire(topics.TRAINING_STARTED, { tray: { length: 0 }, assessor: {}, training: true });
    nav.onOpenView("SampleTray", { training: true });
    opened.length = 0;

    // Returning to a survey (no training flag threaded) must not inherit training mode.
    nav.onOpenView("SiteDetails", {});

    expect(opened[0].args.training).to.not.equal(true);
  });

  it("ignores TRAINING_STARTED on the bus — training is threaded, not stored", function () {
    topics.fire(topics.TRAINING_STARTED, { tray: { length: 0 }, assessor: {}, training: true });

    nav.onOpenView("SiteDetails", {});

    expect(opened[0].args.training).to.not.equal(true);
    expect(opened[0].args.tray).to.equal(undefined);
    expect(opened[0].args.assessor).to.equal(undefined);
  });

  it("threads the active survey's sample/taxa into every screen", function () {
    topics.fire(topics.SURVEY_STARTED, { sample: { id: 1 }, taxa: { length: 2 } });

    nav.onOpenView("SiteDetails", {});

    expect(opened[0].args.sample).to.deep.equal({ id: 1 });
    expect(opened[0].args.taxa).to.deep.equal({ length: 2 });
  });
});
