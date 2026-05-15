require("mocha");
const { expect } = require("chai");
const { buildBody, formatLogEntries, formatCsv, filterLogsByFacility } = require("../../walta-app/app/lib/util/DiagnosticsBundle");

describe("DiagnosticsBundle.buildBody", function () {
  it("formats user + app + device + free-disk into a labelled block", function () {
    const body = buildBody({
      userEmail: "user@example.com",
      userId: 1734,
      appVersion: "4.1.0",
      osname: "ios",
      osVersion: "17.4",
      model: "iPhone15,3",
      locale: "en-AU",
      freeBytes: 13_421_772_800, // exactly 12.5 GiB
    });

    expect(body).to.equal(
      "User email:   user@example.com\n" +
      "User ID:      1734\n" +
      "App version:  4.1.0\n" +
      "OS:           ios 17.4\n" +
      "Phone model:  iPhone15,3\n" +
      "Locale:       en-AU\n" +
      "Free disk:    12.5 GB"
    );
  });

  it("renders 'unknown' for free disk when Ti.Filesystem.spaceAvailable returns a non-number", function () {
    const body = buildBody({
      userEmail: "u@x.com", userId: 1,
      appVersion: "4.1.0", osname: "ios", osVersion: "18.0",
      model: "iPhone17,3", locale: "en-AU",
      freeBytes: NaN,
    });
    expect(body).to.contain("Free disk:    unknown");
  });

  it("renders '(not logged in)' when the user identity is absent", function () {
    const body = buildBody({
      userEmail: null,
      userId: null,
      appVersion: "4.1.0", osname: "ios", osVersion: "17.4",
      model: "iPhone15,3", locale: "en-AU", freeBytes: 1_073_741_824,
    });
    expect(body).to.contain("User email:   (not logged in)");
    expect(body).to.contain("User ID:      (not logged in)");
  });
});

describe("DiagnosticsBundle.formatLogEntries", function () {
  it("renders one row per entry with ISO timestamp + padded level + padded facility + message", function () {
    const text = formatLogEntries([
      { ts: Date.UTC(2026, 4, 15, 7, 32, 25, 0),   level: "info",  facility: "sync",    message: "Sync finished successfully" },
      { ts: Date.UTC(2026, 4, 15, 7, 32, 30, 123), level: "error", facility: "network", message: "GET /samples failed: 500" },
    ]);

    expect(text).to.equal(
      "2026-05-15T07:32:25.000Z info  sync       Sync finished successfully\n" +
      "2026-05-15T07:32:30.123Z error network    GET /samples failed: 500"
    );
  });

  it("returns the empty string for no entries", function () {
    expect(formatLogEntries([])).to.equal("");
  });
});

describe("DiagnosticsBundle.filterLogsByFacility", function () {
  it("keeps entries whose facility appears in the allow-list and drops the rest", function () {
    const entries = [
      { ts: 1, level: "info",  facility: "sync",       message: "kept-sync" },
      { ts: 2, level: "debug", facility: "navigation", message: "dropped-nav" },
      { ts: 3, level: "info",  facility: "network",    message: "kept-network" },
      { ts: 4, level: "info",  facility: "auth",       message: "dropped-auth" },
    ];
    expect(filterLogsByFacility(entries, ["sync", "network"]))
      .to.deep.equal([
        { ts: 1, level: "info", facility: "sync",    message: "kept-sync" },
        { ts: 3, level: "info", facility: "network", message: "kept-network" },
      ]);
  });
});

describe("DiagnosticsBundle.formatCsv", function () {
  it("emits an RFC-4180 CSV with header row + value rows", function () {
    const csv = formatCsv([
      { sampleId: 42, waterbodyName: "Yarra River", lat: -37.78, complete: 1 },
      { sampleId: 43, waterbodyName: null,          lat: -38.10, complete: 0 },
    ]);
    expect(csv).to.equal(
      "sampleId,waterbodyName,lat,complete\n" +
      "42,Yarra River,-37.78,1\n" +
      "43,,-38.1,0"
    );
  });

  it("quotes fields containing commas, double-quotes or newlines, with quotes doubled", function () {
    const csv = formatCsv([
      { name: "Plain" },
      { name: "Has, comma" },
      { name: "She said \"hi\"" },
      { name: "Line1\nLine2" },
    ]);
    expect(csv).to.equal(
      "name\n" +
      "Plain\n" +
      "\"Has, comma\"\n" +
      "\"She said \"\"hi\"\"\"\n" +
      "\"Line1\nLine2\""
    );
  });

  it("emits a '(no rows)' marker for no rows so the attachment is non-empty", function () {
    // Android Intent.ACTION_SEND_MULTIPLE / TiFileProvider silently drops 0-byte
    // attachments; emit a sentinel so empty tables still arrive in the email.
    expect(formatCsv([])).to.equal("(no rows)");
  });
});
