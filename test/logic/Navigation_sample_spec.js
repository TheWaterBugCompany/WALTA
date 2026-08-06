require("mocha");
const { expect } = require("chai");
const { Navigation } = require("../../walta-app/app/lib/logic/Navigation");

// The current sample/taxa thread through args the same way key/Survey already do
// (see onOpenView), so screens receive the model by injection rather than reading
// the Alloy.Models.sample global.
describe("Navigation sample threading", function () {
  let opened, services, nav;

  beforeEach(function () {
    opened = [];
    services = {
      Key: { url: "k" },
      Survey: { name: "survey" },
      View: { openView(ctl, args) { opened.push({ ctl, args }); return Promise.resolve(); } },
    };
    nav = new Navigation(services);
  });

  it("injects the current sample and taxa into an opened controller's args", function () {
    const sample = { id: 1 };
    const taxa = { length: 3 };
    nav.setCurrentSample(sample, taxa);

    nav.onOpenView("SiteDetails", { slide: "none" });

    expect(opened[0].args.sample).to.equal(sample);
    expect(opened[0].args.taxa).to.equal(taxa);
    // still threads the existing app singletons
    expect(opened[0].args.key).to.equal(services.Key);
    expect(opened[0].args.Survey).to.equal(services.Survey);
  });
});
