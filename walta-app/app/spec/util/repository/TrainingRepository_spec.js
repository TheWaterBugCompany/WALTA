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

    it("lists taxa ordered by their caller-supplied position", function () {
        repo.startSession("101");
        repo.addTaxon(9, 1);
        repo.addTaxon(5, 0);
        expect(repo.listTaxa().map(t => t.taxonId)).to.deep.equal([5, 9]);
        expect(repo.listTaxa().map(t => t.position)).to.deep.equal([0, 1]);
    });

    it("gives each taxon a stable, distinct id (the verdict key)", function () {
        repo.startSession("101");
        var a = repo.addTaxon(5, 0);
        var b = repo.addTaxon(9, 1);
        expect(a.id).to.not.equal(b.id);
        expect(repo.listTaxa().map(t => t.id)).to.deep.equal([a.id, b.id]);
    });

    it("keeps the same taxonId entered twice as two distinct entries", function () {
        // A trainee may misidentify the same taxon twice; the duplicate must stay
        // visible (its own row + verdict key), not be silently deduped.
        repo.startSession("101");
        var a = repo.addTaxon(5, 0);
        var b = repo.addTaxon(5, 1);
        expect(a.id).to.not.equal(b.id);
        expect(repo.listTaxa().map(t => t.taxonId)).to.deep.equal([5, 5]);
    });

    it("resumes the persisted session and its taxa after the db is reopened", function () {
        repo.startSession("101");
        repo.addTaxon(5, 0);
        repo.addTaxon(9, 1);
        repo.close();

        var resumed = TrainingRepository.open(TEST_DB);
        expect(resumed.currentSession()).to.equal("101");
        expect(resumed.listTaxa().map(t => t.taxonId)).to.deep.equal([5, 9]);
        resumed.close();
    });

    it("starting a new session clears the previous session's taxa", function () {
        repo.startSession("101");
        repo.addTaxon(5, 0);
        repo.startSession("102");
        expect(repo.currentSession()).to.equal("102");
        expect(repo.listTaxa()).to.be.empty;
    });

    it("removes a taxon by id, keeping the rest", function () {
        repo.startSession("101");
        var a = repo.addTaxon(5, 0);
        repo.addTaxon(9, 1);
        repo.removeTaxon(a.id);
        expect(repo.listTaxa().map(t => t.taxonId)).to.deep.equal([9]);
    });

    it("clear() ends the session", function () {
        repo.startSession("101");
        repo.addTaxon(5, 0);
        repo.clear();
        expect(repo.currentSession()).to.equal(null);
        expect(repo.listTaxa()).to.be.empty;
    });
});
