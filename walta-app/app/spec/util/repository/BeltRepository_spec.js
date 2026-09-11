require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { removeDatabase } = require("spec/util/TestUtils");

var BeltRepository = require("repository/BeltRepository");
var Migrator = require("repository/Migrator");

const TEST_DB = "waterbug_data_test";

describe("BeltRepository", function () {
    var repo;

    beforeEach(function () {
        removeDatabase(TEST_DB);
        Migrator.migrate(TEST_DB);
        repo = BeltRepository.open(TEST_DB);
    });

    afterEach(function () {
        if (repo) repo.close();
        removeDatabase(TEST_DB);
    });

    it("holds no belt for a user who has never earned one", function () {
        expect(repo.beltLevelFor("38")).to.equal(null);
    });

    it("holds no belt for the signed-out user before one is earned", function () {
        expect(repo.beltLevelFor(null)).to.equal(null);
    });

    it("remembers the belt a signed-in user earned", function () {
        repo.awardBeltLevel("38", 3);
        expect(repo.beltLevelFor("38")).to.equal(3);
    });

    it("remembers the belt earned while signed out", function () {
        repo.awardBeltLevel(null, 2);
        expect(repo.beltLevelFor(null)).to.equal(2);
    });

    it("keeps one user's belt clear of another's", function () {
        repo.awardBeltLevel("38", 3);
        repo.awardBeltLevel("77", 6);
        expect(repo.beltLevelFor("38")).to.equal(3);
        expect(repo.beltLevelFor("77")).to.equal(6);
    });

    it("keeps the signed-out belt clear of a signed-in user's", function () {
        repo.awardBeltLevel(null, 2);
        repo.awardBeltLevel("38", 5);
        expect(repo.beltLevelFor(null)).to.equal(2);
        expect(repo.beltLevelFor("38")).to.equal(5);
    });

    it("replaces a user's belt when they earn a higher one", function () {
        repo.awardBeltLevel("38", 3);
        repo.awardBeltLevel("38", 4);
        expect(repo.beltLevelFor("38")).to.equal(4);
    });

    it("gives a belt earned while signed out to the user who then signs in", function () {
        repo.awardBeltLevel(null, 2);
        repo.claimAnonymousBelt("38");
        expect(repo.beltLevelFor("38")).to.equal(2);
    });

    it("leaves nothing behind for the next signed-out user to inherit", function () {
        repo.awardBeltLevel(null, 2);
        repo.claimAnonymousBelt("38");
        expect(repo.beltLevelFor(null)).to.equal(null);
    });

    it("leaves a returning user's own belt alone when there is nothing to claim", function () {
        repo.awardBeltLevel("38", 5);
        repo.claimAnonymousBelt("38");
        expect(repo.beltLevelFor("38")).to.equal(5);
    });

    it("keeps the better belt when a signed-out belt is claimed by a user who already has one", function () {
        repo.awardBeltLevel("38", 5);
        repo.awardBeltLevel(null, 2);
        repo.claimAnonymousBelt("38");
        expect(repo.beltLevelFor("38")).to.equal(5);
    });

    it("has nothing to push for a user who has never earned a belt", function () {
        expect(repo.beltNeedingPush("38")).to.equal(null);
    });

    it("offers a newly earned belt for pushing", function () {
        repo.awardBeltLevel("38", 3);
        expect(repo.beltNeedingPush("38")).to.equal(3);
    });

    it("stops offering a belt once it has been pushed", function () {
        repo.awardBeltLevel("38", 3);
        repo.markBeltPushed("38", 3);
        expect(repo.beltNeedingPush("38")).to.equal(null);
    });

    it("offers a promotion earned after an earlier push", function () {
        repo.awardBeltLevel("38", 3);
        repo.markBeltPushed("38", 3);
        repo.awardBeltLevel("38", 6);
        expect(repo.beltNeedingPush("38")).to.equal(6);
    });

    it("keeps one user's pushed level clear of another's", function () {
        repo.awardBeltLevel("38", 3);
        repo.awardBeltLevel("77", 3);
        repo.markBeltPushed("38", 3);
        expect(repo.beltNeedingPush("77")).to.equal(3);
    });

    // The push is deferred until there is a network, which may be after a
    // restart — so what has been pushed has to outlive the process.
    it("remembers what it has pushed across a close and reopen", function () {
        repo.awardBeltLevel("38", 3);
        repo.markBeltPushed("38", 3);
        repo.close();
        repo = BeltRepository.open(TEST_DB);
        expect(repo.beltNeedingPush("38")).to.equal(null);
    });

    it("offers a belt claimed from the signed-out user for pushing", function () {
        repo.awardBeltLevel("38", 2);
        repo.markBeltPushed("38", 2);
        repo.awardBeltLevel(null, 5);
        repo.claimAnonymousBelt("38");
        expect(repo.beltNeedingPush("38")).to.equal(5);
    });
});
