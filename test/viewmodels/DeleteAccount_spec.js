require("mocha");
const { expect } = require("chai");
const DeleteAccountViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/DeleteAccount");

describe("DeleteAccountViewModel", function () {

  // Records what the account was asked to do, and lets a test decide how the
  // server answers.
  function fakeCerdiApi({ loginFails = false, deleteFails = false } = {}) {
    return {
      calls: [],
      stored: "a-token",
      retrieveUsername() { return "test@example.com"; },
      loginUser(email, password) {
        this.calls.push(["loginUser", email, password]);
        return loginFails ? Promise.reject(new Error("401")) : Promise.resolve({});
      },
      deleteUser() {
        this.calls.push(["deleteUser"]);
        return deleteFails ? Promise.reject(new Error("500")) : Promise.resolve();
      },
      storeUserToken(a, b) { this.stored = b; },
    };
  }

  function build(apiOptions) {
    const cerdiApi = fakeCerdiApi(apiOptions);
    const fired = [];
    const topics = { LOGGEDOUT: "loggedout", HOME: "home", fireTopicEvent: (t) => fired.push(t) };
    return { vm: new DeleteAccountViewModel({ cerdiApi, topics }), cerdiApi, fired };
  }

  it("will not delete an account until a password is entered", function () {
    const { vm } = build();
    expect(vm.deleteEnabled).to.be.false;
    vm.password = "password";
    expect(vm.deleteEnabled).to.be.true;
  });

  it("does nothing at all when asked to delete with no password", async function () {
    const { vm, cerdiApi } = build();
    await vm.confirmDelete();
    expect(cerdiApi.calls).to.deep.equal([]);
  });

  // The password is checked against the server before anything is destroyed,
  // so a mistyped one costs nothing.
  it("proves the password before deleting anything", async function () {
    const { vm, cerdiApi } = build();
    vm.password = "password";
    await vm.confirmDelete();
    expect(cerdiApi.calls).to.deep.equal([
      ["loginUser", "test@example.com", "password"],
      ["deleteUser"],
    ]);
  });

  it("never deletes the account when the password is wrong", async function () {
    const { vm, cerdiApi } = build({ loginFails: true });
    vm.password = "wrong";
    await vm.confirmDelete();
    expect(cerdiApi.calls.map((c) => c[0])).to.deep.equal(["loginUser"]);
  });

  it("says so when the password is wrong", async function () {
    const { vm } = build({ loginFails: true });
    let told = 0;
    vm.on("passwordIncorrect", () => told++);
    vm.password = "wrong";
    await vm.confirmDelete();
    expect(told).to.equal(1);
  });

  it("keeps the account signed in when the password is wrong", async function () {
    const { vm, cerdiApi, fired } = build({ loginFails: true });
    vm.password = "wrong";
    await vm.confirmDelete();
    expect(cerdiApi.stored).to.equal("a-token");
    expect(fired).to.deep.equal([]);
  });

  // The account is gone, so the app cannot stay signed in to it.
  it("signs out and goes home once the account is deleted", async function () {
    const { vm, cerdiApi, fired } = build();
    vm.password = "password";
    await vm.confirmDelete();
    expect(cerdiApi.stored).to.equal(null);
    expect(fired).to.deep.equal(["loggedout", "home"]);
  });

  it("says so when the account could not be deleted", async function () {
    const { vm, cerdiApi, fired } = build({ deleteFails: true });
    let told = 0;
    vm.on("deleteFailed", () => told++);
    vm.password = "password";
    await vm.confirmDelete();
    expect(told).to.equal(1);
    expect(cerdiApi.stored, "still signed in").to.equal("a-token");
    expect(fired).to.deep.equal([]);
  });

  it("closes when asked", function () {
    const { vm } = build();
    let closed = 0;
    vm.on("close", () => closed++);
    vm.close();
    expect(closed).to.equal(1);
  });

});
