require("mocha");
const { expect } = require("chai");

// The manifest replaces Migrator's old Ti.Filesystem.getDirectoryListing()
// enumeration. The directory walk returned empty on iOS device — see WB-78.
// An explicit static manifest is bundled at build time and resolves the
// same way on every platform.
describe("migrations manifest", function () {
  let migrations;

  before(function () {
    migrations = require("../../walta-app/app/lib/repository/migrations");
  });

  it("exposes an array of migrations", function () {
    expect(migrations).to.be.an("array");
    expect(migrations.length).to.be.at.least(1);
  });

  it("each entry has id (string), table (string), up + down (functions)", function () {
    for (const m of migrations) {
      expect(m.id, "id").to.be.a("string");
      expect(m.id, "id matches timestamp shape").to.match(/^\d+$/);
      expect(m.table, "table").to.be.a("string");
      expect(m.up, "up").to.be.a("function");
      expect(m.down, "down").to.be.a("function");
    }
  });

  it("includes the logs table migration", function () {
    const logs = migrations.find(m => m.table === "logs");
    expect(logs, "logs migration in manifest").to.exist;
  });
});
