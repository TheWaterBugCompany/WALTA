require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { removeDatabase } = require("spec/util/TestUtils");

var LogRepository = require("repository/LogRepository");
var Migrator = require("repository/Migrator");

const TEST_DB = "waterbug_data_test";

describe("LogRepository", function () {
    var repo;

    beforeEach(function () {
        removeDatabase(TEST_DB);
        Migrator.migrate(TEST_DB);
        repo = LogRepository.open(TEST_DB);
    });

    afterEach(function () {
        if (repo) repo.close();
        removeDatabase(TEST_DB);
    });

    describe("append + query", function () {
        it("returns the appended entry", function () {
            repo.append({ ts: 100, level: "info", facility: "sync", message: "uploaded" });
            const rows = repo.query();
            expect(rows).to.have.length(1);
            expect(rows[0]).to.deep.equal({
                ts: 100, level: "info", facility: "sync", message: "uploaded"
            });
        });

        it("returns rows in newest-first order (ts DESC)", function () {
            repo.append({ ts: 100, level: "info", facility: "sync", message: "first" });
            repo.append({ ts: 200, level: "info", facility: "sync", message: "second" });
            repo.append({ ts: 150, level: "info", facility: "sync", message: "middle" });
            const rows = repo.query();
            expect(rows.map(r => r.message)).to.deep.equal(["second", "middle", "first"]);
        });

        it("filters by facility", function () {
            repo.append({ ts: 100, level: "info", facility: "sync", message: "s1" });
            repo.append({ ts: 200, level: "info", facility: "auth", message: "a1" });
            repo.append({ ts: 300, level: "info", facility: "sync", message: "s2" });
            const rows = repo.query({ facility: "sync" });
            expect(rows.map(r => r.message)).to.deep.equal(["s2", "s1"]);
        });

        it("filters by minLevel (debug < trace < info < warn < error)", function () {
            repo.append({ ts: 100, level: "debug", facility: "x", message: "d" });
            repo.append({ ts: 200, level: "trace", facility: "x", message: "t" });
            repo.append({ ts: 300, level: "info",  facility: "x", message: "i" });
            repo.append({ ts: 400, level: "warn",  facility: "x", message: "w" });
            repo.append({ ts: 500, level: "error", facility: "x", message: "e" });
            const rows = repo.query({ minLevel: "info" });
            expect(rows.map(r => r.level)).to.deep.equal(["error", "warn", "info"]);
        });

        it("combines facility and minLevel filters", function () {
            repo.append({ ts: 100, level: "info",  facility: "sync", message: "match-1" });
            repo.append({ ts: 200, level: "debug", facility: "sync", message: "wrong-level" });
            repo.append({ ts: 300, level: "info",  facility: "auth", message: "wrong-facility" });
            repo.append({ ts: 400, level: "warn",  facility: "sync", message: "match-2" });
            const rows = repo.query({ facility: "sync", minLevel: "info" });
            expect(rows.map(r => r.message)).to.deep.equal(["match-2", "match-1"]);
        });

        it("respects the limit option", function () {
            for (let i = 1; i <= 5; i++) {
                repo.append({ ts: i * 100, level: "info", facility: "x", message: "m" + i });
            }
            const rows = repo.query({ limit: 2 });
            expect(rows.map(r => r.message)).to.deep.equal(["m5", "m4"]);
        });
    });

    describe("prune", function () {
        it("deletes entries older than maxAgeMs", function () {
            const now = Date.now();
            repo.append({ ts: now - 100,        level: "info", facility: "x", message: "fresh" });
            repo.append({ ts: now - 1000 * 60 * 60 * 24 * 30, level: "info", facility: "x", message: "stale" });
            repo.prune(1000 * 60 * 60 * 24 * 14, null);
            const rows = repo.query();
            expect(rows.map(r => r.message)).to.deep.equal(["fresh"]);
        });

        it("deletes oldest rows when row count exceeds maxRows", function () {
            for (let i = 1; i <= 10; i++) {
                repo.append({ ts: i * 100, level: "info", facility: "x", message: "m" + i });
            }
            repo.prune(null, 3);
            const rows = repo.query();
            expect(rows.map(r => r.message)).to.deep.equal(["m10", "m9", "m8"]);
        });

        it("applies both age and row caps when both are passed", function () {
            const now = Date.now();
            // 1 stale entry (gets killed by age), then 5 fresh entries
            // inserted oldest-ts → newest-ts so id ordering and ts ordering
            // agree. Row cap keeps the top 3 by id (= the 3 newest).
            repo.append({ ts: now - 1000 * 60 * 60 * 24 * 30, level: "info", facility: "x", message: "stale" });
            for (let i = 1; i <= 5; i++) {
                repo.append({ ts: now - (6 - i), level: "info", facility: "x", message: "m" + i });
            }
            repo.prune(1000 * 60 * 60 * 24 * 14, 3);
            const rows = repo.query();
            expect(rows.map(r => r.message).sort()).to.deep.equal(["m3", "m4", "m5"]);
        });
    });

    describe("migration", function () {
        it("schema survives close+reopen (migrations table tracks applied state)", function () {
            repo.append({ ts: 100, level: "info", facility: "x", message: "before close" });
            repo.close();
            repo = LogRepository.open(TEST_DB);
            const rows = repo.query();
            expect(rows).to.have.length(1);
            expect(rows[0].message).to.equal("before close");
        });
    });
});
