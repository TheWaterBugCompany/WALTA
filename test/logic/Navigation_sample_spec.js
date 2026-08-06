require("mocha");
const { expect } = require("chai");
const { Navigation } = require("../../walta-app/app/lib/logic/Navigation");

// Minimal in-memory stand-in for the Topics bus (subscribe + fire).
function fakeTopics() {
  const subs = {};
  return {
    SURVEY_STARTED: "surveystarted",
    subscribe(t, cb) { (subs[t] = subs[t] || []).push(cb); },
    fire(t, data) { (subs[t] || []).forEach((cb) => cb(data)); },
  };
}

// The roots that establish a survey's sample announce it on SURVEY_STARTED;
// Navigation seeds itself from the bus and threads the sample/taxa through args
// the same way key/Survey already do — so screens receive the model by injection
// rather than reading the Alloy.Models.sample global.
describe("Navigation sample threading", function () {
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

  it("threads the sample+taxa announced on SURVEY_STARTED into an opened controller's args", function () {
    const sample = { id: 1 };
    const taxa = { length: 3 };
    topics.fire(topics.SURVEY_STARTED, { sample, taxa });

    nav.onOpenView("SiteDetails", { slide: "none" });

    expect(opened[0].args.sample).to.equal(sample);
    expect(opened[0].args.taxa).to.equal(taxa);
    // still threads the existing app singletons
    expect(opened[0].args.key).to.equal(services.Key);
    expect(opened[0].args.Survey).to.equal(services.Survey);
  });
});
