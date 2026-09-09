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
  const awards = createBeltAwards({
    repository,
    exercises,
    cerdiApi: { retrieveUserId: () => userId },
  });
  return { awards, repository };
}

function fakeRepository() {
  const rows = new Map();
  const key = (id) => (id === null || id === undefined ? "signed-out" : String(id));
  return {
    beltLevelFor: (id) => (rows.has(key(id)) ? rows.get(key(id)) : null),
    awardBeltLevel: (id, level) => { rows.set(key(id), level); },
    claimAnonymousBelt: (id) => {
      if (!rows.has("signed-out")) return;
      const pending = rows.get("signed-out");
      const held = rows.has(key(id)) ? rows.get(key(id)) : null;
      if (held === null || pending > held) rows.set(key(id), pending);
      rows.delete("signed-out");
    },
  };
}
