require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { removeDatabase } = require("spec/util/TestUtils");

var TrainingRepository = require("repository/TrainingRepository");
var Migrator = require("repository/Migrator");

const TEST_DB = "waterbug_data_test";

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
        expect(repo.currentSessionCode()).to.equal(null);
    });

    it("starts a session with an empty tray and records the code as current", function () {
        var tray = repo.startSession("101");
        expect(repo.currentSessionCode()).to.equal("101");
        expect(tray.length).to.equal(0);
    });

    it("adds a taxon to the tray and returns it as a domain model", function () {
        var tray = repo.startSession("101");
        var taxon = repo.addTaxon(tray, 5, 0);
        expect(taxon.taxonId).to.equal(5);
        expect(taxon.position).to.equal(0);
        expect(taxon.id).to.be.ok;
        expect(tray.at(0)).to.equal(taxon);
    });

    it("orders the tray by position", function () {
        var tray = repo.startSession("101");
        repo.addTaxon(tray, 9, 1);
        repo.addTaxon(tray, 5, 0);
        expect(tray.taxa().map(t => t.taxonId)).to.deep.equal([5, 9]);
    });

    it("gives each taxon a stable, distinct id (the verdict key)", function () {
        var tray = repo.startSession("101");
        var a = repo.addTaxon(tray, 5, 0);
        var b = repo.addTaxon(tray, 9, 1);
        expect(a.id).to.not.equal(b.id);
    });

    it("keeps the same taxonId entered twice as two distinct entries", function () {
        var tray = repo.startSession("101");
        var a = repo.addTaxon(tray, 5, 0);
        var b = repo.addTaxon(tray, 5, 1);
        expect(a.id).to.not.equal(b.id);
        expect(tray.taxa().map(t => t.taxonId)).to.deep.equal([5, 5]);
    });

    it("resumes the persisted session and its tray after the db is reopened", function () {
        var tray = repo.startSession("101");
        repo.addTaxon(tray, 5, 0);
        repo.addTaxon(tray, 9, 1);
        repo.close();

        var resumed = TrainingRepository.open(TEST_DB);
        expect(resumed.currentSessionCode()).to.equal("101");
        expect(resumed.loadTray().taxa().map(t => t.taxonId)).to.deep.equal([5, 9]);
        resumed.close();
    });

    it("starting a new session clears the previous session's taxa", function () {
        var tray = repo.startSession("101");
        repo.addTaxon(tray, 5, 0);
        repo.startSession("102");
        expect(repo.currentSessionCode()).to.equal("102");
        expect(repo.loadTray().length).to.equal(0);
    });

    it("removes a taxon from the tray and the store", function () {
        var tray = repo.startSession("101");
        var a = repo.addTaxon(tray, 5, 0);
        repo.addTaxon(tray, 9, 1);
        repo.removeTaxon(tray, a);
        expect(tray.taxa().map(t => t.taxonId)).to.deep.equal([9]);
        expect(repo.loadTray().taxa().map(t => t.taxonId)).to.deep.equal([9]);
    });

    it("clear() ends the session", function () {
        var tray = repo.startSession("101");
        repo.addTaxon(tray, 5, 0);
        repo.clear();
        expect(repo.currentSessionCode()).to.equal(null);
        expect(repo.loadTray().length).to.equal(0);
    });
});
