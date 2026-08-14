require("mocha");
const { expect } = require("chai");
const LogEntry = require("../../walta-app/app/lib/models/LogEntry");

describe("LogEntry", function () {
  it("exposes the log fields it was created with", function () {
    const entry = new LogEntry({ ts: 100, level: "info", facility: "sync", message: "uploaded" });
    expect(entry.ts).to.equal(100);
    expect(entry.level).to.equal("info");
    expect(entry.facility).to.equal("sync");
    expect(entry.message).to.equal("uploaded");
  });
});
