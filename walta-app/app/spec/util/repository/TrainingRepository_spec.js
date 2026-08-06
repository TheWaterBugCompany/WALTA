require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { removeDatabase } = require("spec/util/TestUtils");

var TrainingRepository = require("repository/TrainingRepository");
var Migrator = require("repository/Migrator");

const TEST_DB = "waterbug_training_test";

describe("TrainingRepository", function () {
    var repo;

    beforeEach(function () {
        removeDatabase(TEST_DB);
        Migrator.migrate(TEST_DB);
        repo = TrainingRepository.open(TEST_DB);
    });

    afterEach(function () {
        if (repo) repo.close();
        removeDatabase(TEST_DB);
    });

    it("has no current session before one is started", function () {
        expect(repo.currentSession()).to.equal(null);
    });

    it("records the started session as current", function () {
        repo.startSession("101");
        expect(repo.currentSession()).to.equal("101");
    });

    it("appends taxa in order and lists them with contiguous positions", function () {
        repo.startSession("101");
        repo.addTaxon(5);
        repo.addTaxon(9);
        expect(repo.list().map(t => t.taxonId)).to.deep.equal([5, 9]);
        expect(repo.list().map(t => t.position)).to.deep.equal([0, 1]);
    });

    it("gives each taxon a stable, distinct id (the verdict key)", function () {
        repo.startSession("101");
        var a = repo.addTaxon(5);
        var b = repo.addTaxon(9);
        expect(a.id).to.not.equal(b.id);
        expect(repo.list().map(t => t.id)).to.deep.equal([a.id, b.id]);
    });

    it("resumes the session and its taxa after the db is reopened (restart)", function () {
        repo.startSession("101");
        repo.addTaxon(5);
        repo.addTaxon(9);
        repo.close();

        var resumed = TrainingRepository.open(TEST_DB);
        expect(resumed.currentSession()).to.equal("101");
        expect(resumed.list().map(t => t.taxonId)).to.deep.equal([5, 9]);
        resumed.close();
    });

    it("starting a new session clears the previous session's taxa", function () {
        repo.startSession("101");
        repo.addTaxon(5);
        repo.startSession("102");
        expect(repo.currentSession()).to.equal("102");
        expect(repo.list()).to.be.empty;
    });

    it("removes a taxon by id, keeping the rest in order", function () {
        repo.startSession("101");
        var a = repo.addTaxon(5);
        repo.addTaxon(9);
        repo.removeTaxon(a.id);
        expect(repo.list().map(t => t.taxonId)).to.deep.equal([9]);
    });

    it("clear() ends the session", function () {
        repo.startSession("101");
        repo.addTaxon(5);
        repo.clear();
        expect(repo.currentSession()).to.equal(null);
        expect(repo.list()).to.be.empty;
    });
});
