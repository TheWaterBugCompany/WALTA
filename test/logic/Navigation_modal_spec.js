require("mocha");
const { expect } = require("chai");
const { Navigation } = require("../../walta-app/app/lib/logic/Navigation");

describe("Navigation modals", function () {
  let calls, services, nav;

  beforeEach(function () {
    calls = [];
    services = {
      topics: { SURVEY_STARTED: "surveystarted", subscribe() {} },
      View: {
        openModal(name, args, svcs) { calls.push({ fn: "openModal", name, args, svcs }); },
        closeModal() { calls.push({ fn: "closeModal" }); },
      },
    };
    nav = new Navigation(services);
  });

  it("openModal delegates to View.openModal with the services bag", function () {
    nav.openModal("Academy", { code: "123" });
    expect(calls).to.deep.equal([
      { fn: "openModal", name: "Academy", args: { code: "123" }, svcs: services },
    ]);
  });

  it("openModal defaults args to an empty object", function () {
    nav.openModal("Academy");
    expect(calls[0].args).to.deep.equal({});
  });

  // The Main.js route wraps the result in checkForErrors, which calls .catch —
  // so openModal must hand back a promise even though View.openModal is sync.
  it("openModal returns a thenable", function () {
    expect(nav.openModal("Academy")).to.have.property("then").that.is.a("function");
  });

  it("closeModal delegates to View.closeModal", function () {
    nav.closeModal();
    expect(calls).to.deep.equal([{ fn: "closeModal" }]);
  });
});
