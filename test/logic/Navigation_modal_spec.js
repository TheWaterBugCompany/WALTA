require("mocha");
const { expect } = require("chai");
const { Navigation } = require("../../walta-app/app/lib/logic/Navigation");

describe("Navigation modals", function () {
  let calls, services, nav;

  beforeEach(function () {
    calls = [];
    services = {
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

  it("closeModal delegates to View.closeModal", function () {
    nav.closeModal();
    expect(calls).to.deep.equal([{ fn: "closeModal" }]);
  });
});
