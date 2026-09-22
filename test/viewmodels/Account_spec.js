require("mocha");
const { expect } = require("chai");
const AccountViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Account");
const Belts = require("../../walta-app/app/lib/logic/Belts");
const Topics = require("../../walta-app/app/lib/ui/Topics");

describe("AccountViewModel", function () {

  function build({ level = 0, user = { email: "test.user@example.com", name: "Test User" },
                   username = "test.user@example.com" } = {}) {
    return new AccountViewModel({
      level,
      topics: Topics,
      cerdiApi: {
        retrieveUsername: () => username,
        retrieveUser: () => Promise.resolve(user),
        storeUserToken: () => {},
      },
    });
  }

  it("shows the email it already holds before the server answers", function () {
    expect(build().email).to.equal("test.user@example.com");
  });

  it("has no name until the server answers", function () {
    expect(build().name).to.equal("");
  });

  it("fills in the name the server gives back", async function () {
    const vm = build();
    await vm.load();
    expect(vm.name).to.equal("Test User");
  });

  it("keeps the email it holds when the server cannot be reached", async function () {
    const vm = new AccountViewModel({
      level: 0,
      topics: Topics,
      cerdiApi: {
        retrieveUsername: () => "offline@example.com",
        retrieveUser: () => Promise.reject(new Error("no network")),
        storeUserToken: () => {},
      },
    });
    await vm.load();
    expect(vm.email).to.equal("offline@example.com");
    expect(vm.name).to.equal("");
  });

  it("shows no belts for a trainee who has earned none", function () {
    expect(build({ level: 0 }).belts).to.deep.equal([]);
  });

  // Lowest first, so the grid reads top-left to bottom-right in the order they
  // were earned.
  it("shows every belt earned, lowest first", function () {
    const vm = build({ level: 3 });
    expect(vm.belts.map((b) => b.color)).to.deep.equal(
      [Belts.at(1).color, Belts.at(2).color, Belts.at(3).color]);
  });

  it("keys each belt by its level so the grid reconciles", function () {
    expect(build({ level: 2 }).belts.map((b) => b.key)).to.deep.equal(["belt:1", "belt:2"]);
  });

  // Three across the grid, with room between them — a wrapping row cannot space
  // its own children, so each belt carries its own gap.
  it("sizes the belts to sit three to a row, with room between them", function () {
    const belt = build({ level: 1 }).belts[0];
    const across = parseFloat(belt.width) + parseFloat(belt.left);
    expect(across * 3).to.be.at.most(100);
    expect(parseFloat(belt.left)).to.be.greaterThan(0);
    expect(belt.height).to.not.equal("100%");
  });

  it("asks the view to confirm before logging out", function () {
    const vm = build();
    let asked = 0;
    vm.on("confirmLogOut", () => asked++);
    vm.logOut();
    expect(asked).to.equal(1);
  });

  it("discards the stored token once the logout is confirmed", function () {
    let stored = "a-token";
    const vm = new AccountViewModel({
      level: 0,
      topics: Topics,
      cerdiApi: {
        retrieveUsername: () => "test.user@example.com",
        retrieveUser: () => Promise.resolve({}),
        storeUserToken: (a, b) => { stored = b; },
      },
    });
    vm.completeLogOut();
    expect(stored).to.equal(null);
  });

  it("announces the logout so the rest of the app can react", function () {
    let fired = [];
    const vm = new AccountViewModel({
      level: 0,
      topics: { LOGGEDOUT: "loggedout", HOME: "home", fireTopicEvent: (t) => fired.push(t) },
      cerdiApi: {
        retrieveUsername: () => "test.user@example.com",
        retrieveUser: () => Promise.resolve({}),
        storeUserToken: () => {},
      },
    });
    vm.completeLogOut();
    expect(fired).to.deep.equal(["loggedout", "home"]);
  });

  // Deleting an account is a card of its own; the button is here so the screen
  // is the shape it will keep, and does nothing yet.
  it("does nothing when delete account is pressed", function () {
    const vm = build();
    let fired = 0;
    vm.on("deleteAccount", () => fired++);
    vm.deleteAccount();
    expect(fired).to.equal(0);
  });

});
