require("mocha");
const { expect } = require("chai");
const createBeltAwards = require("logic/BeltAwards");
const Belts = require("logic/Belts");

describe("logic/BeltAwards", function () {

  it("awards the belt the completed session carries", function () {
    const { awards, repository } = make();
    expect(awards.awardFor("101")).to.equal(3);
    expect(repository.beltLevelFor("38")).to.equal(3);
  });

  it("awards nothing for a session that carries no belt", function () {
    const { awards } = make();
    expect(awards.awardFor("nosuch")).to.equal(null);
  });

  it("promotes a user who completes a harder session", function () {
    const { awards, repository } = make();
    awards.awardFor("101");
    expect(awards.awardFor("202")).to.equal(6);
    expect(repository.beltLevelFor("38")).to.equal(6);
  });

  it("does not demote a user who repeats an easier session", function () {
    const { awards, repository } = make();
    awards.awardFor("202");
    expect(awards.awardFor("101")).to.equal(6);
    expect(repository.beltLevelFor("38")).to.equal(6);
  });

  // retrieveUserId returns undefined with nobody signed in; null is what the
  // store is asked with. Both have to land on the signed-out row.
  [undefined, null].forEach(function (absent) {
    it(`awards to the signed-out user when retrieveUserId gives ${absent}`, function () {
      const { awards, repository } = make({ userId: absent });
      awards.awardFor("101");
      expect(repository.beltLevelFor(null)).to.equal(3);
    });
  });

  it("reports the belt colours the held level is drawn in", function () {
    const { awards } = make();
    awards.awardFor("101");
    expect(awards.currentBelt()).to.deep.equal(Belts.at(3));
  });

  it("reports no belt before one is earned", function () {
    const { awards } = make();
    expect(awards.currentBelt()).to.equal(null);
  });

  it("pushes a newly earned belt to the server", async function () {
    const { awards, cerdiApi } = make();
    awards.awardFor("101");
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.deep.equal([{ belt_level: 3 }]);
  });

  it("does not push a belt the server already has", async function () {
    const { awards, cerdiApi } = make();
    awards.awardFor("101");
    await awards.pushPendingBelt();
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.have.lengthOf(1);
  });

  it("pushes a promotion earned after an earlier push", async function () {
    const { awards, cerdiApi } = make();
    awards.awardFor("101");
    await awards.pushPendingBelt();
    awards.awardFor("202");
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.deep.equal([{ belt_level: 3 }, { belt_level: 6 }]);
  });

  it("pushes nothing when no belt has been earned", async function () {
    const { awards, cerdiApi } = make();
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.be.empty;
  });

  // Offline: the belt is already awarded locally, so a failed push must leave
  // it pending for the next attempt rather than swallow it.
  it("leaves the belt pending when the push fails", async function () {
    const { awards, cerdiApi } = make({ updateUserRejects: true });
    awards.awardFor("101");
    let rejected = false;
    try { await awards.pushPendingBelt(); } catch (err) { rejected = true; }
    expect(rejected, "a failed push rejects so the caller can log it").to.be.true;
    cerdiApi.updateUserRejects = false;
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.deep.equal([{ belt_level: 3 }, { belt_level: 3 }]);
  });

  it("does not push a belt earned while signed out", async function () {
    const { awards, cerdiApi } = make({ userId: null });
    awards.awardFor("101");
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.be.empty;
  });

  it("takes the server's belt when it is higher than the one held here", async function () {
    const { awards, repository } = make({ serverBeltLevel: 6 });
    awards.awardFor("101");
    await awards.reconcileWithServer();
    expect(repository.beltLevelFor("38")).to.equal(6);
  });

  it("does not push back a belt it has just taken from the server", async function () {
    const { awards, cerdiApi } = make({ serverBeltLevel: 6 });
    awards.awardFor("101");
    await awards.reconcileWithServer();
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.be.empty;
  });

  it("keeps a belt earned here that beats the server's, and pushes it", async function () {
    const { awards, repository, cerdiApi } = make({ serverBeltLevel: 3 });
    awards.awardFor("202");
    await awards.reconcileWithServer();
    expect(repository.beltLevelFor("38")).to.equal(6);
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.deep.equal([{ belt_level: 6 }]);
  });

  it("takes the server's belt on a device that has earned none", async function () {
    const { awards, repository } = make({ serverBeltLevel: 4 });
    await awards.reconcileWithServer();
    expect(repository.beltLevelFor("38")).to.equal(4);
  });

  it("leaves the local belt alone when the server holds none", async function () {
    const { awards, repository } = make({ serverBeltLevel: null });
    awards.awardFor("101");
    await awards.reconcileWithServer();
    expect(repository.beltLevelFor("38")).to.equal(3);
  });

  it("does not ask the server who it is when signed out", async function () {
    const { awards, cerdiApi } = make({ userId: null, serverBeltLevel: 6 });
    await awards.reconcileWithServer();
    expect(cerdiApi.reads).to.equal(0);
  });

  // Two devices: the other one earned a higher belt while this one was offline.
  // Pushing this device's pending belt blindly would demote the account.
  it("does not demote the server to a belt earned offline here", async function () {
    const { awards, cerdiApi, repository } = make({ serverBeltLevel: 6 });
    awards.awardFor("101");
    await awards.pushPendingBelt();
    expect(cerdiApi.updates).to.be.empty;
    expect(repository.beltLevelFor("38")).to.equal(6);
  });

  it("hands a belt earned while signed out to the user who signs in", function () {
    const signedOut = make({ userId: null });
    signedOut.awards.awardFor("101");
    const signedIn = make({ repository: signedOut.repository });
    expect(signedIn.awards.currentBelt()).to.equal(null);
    signedIn.awards.claimAnonymousBelt();
    expect(signedIn.awards.currentBelt()).to.deep.equal(Belts.at(3));
  });

});

// userId is read with `in` rather than a default so a test can pass undefined
// — the value retrieveUserId actually gives when nobody is signed in.
function make(options = {}) {
  const userId = "userId" in options ? options.userId : 38;
  const repository = options.repository || fakeRepository();
  const exercises = {
    beltLevelFor: (code) => ({ "101": 3, "202": 6 })[String(code)] || null,
  };
  const cerdiApi = fakeCerdiApi(userId, options);
  const awards = createBeltAwards({ repository, exercises, cerdiApi });
  return { awards, repository, cerdiApi };
}

function fakeRepository() {
  const rows = new Map();
  const pushed = new Map();
  const key = (id) => (id === null || id === undefined ? "signed-out" : String(id));
  return {
    beltLevelFor: (id) => (rows.has(key(id)) ? rows.get(key(id)) : null),
    awardBeltLevel: (id, level) => { rows.set(key(id), level); },
    beltNeedingPush: (id) => {
      const held = rows.has(key(id)) ? rows.get(key(id)) : null;
      return held !== null && held !== pushed.get(key(id)) ? held : null;
    },
    markBeltPushed: (id, level) => { pushed.set(key(id), level); },
    claimAnonymousBelt: (id) => {
      if (!rows.has("signed-out")) return;
      const pending = rows.get("signed-out");
      const held = rows.has(key(id)) ? rows.get(key(id)) : null;
      if (held === null || pending > held) rows.set(key(id), pending);
      rows.delete("signed-out");
    },
  };
}

function fakeCerdiApi(userId, options) {
  const updates = [];
  return {
    updates,
    reads: 0,
    updateUserRejects: options.updateUserRejects,
    retrieveUserId: () => userId,
    retrieveUser() {
      this.reads++;
      return Promise.resolve({ qaqc_level: options.serverBeltLevel || null });
    },
    updateUser(body) {
      updates.push(body);
      return this.updateUserRejects
        ? Promise.reject(new Error("offline"))
        : Promise.resolve({});
    },
  };
}
