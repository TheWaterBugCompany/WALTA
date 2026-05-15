require("mocha");
const { expect } = require("chai");
const { buildBody } = require("../../walta-app/app/lib/util/DiagnosticsBundle");

describe("DiagnosticsBundle.buildBody", function () {
  it("formats app + device + free-disk into a labelled block", function () {
    const body = buildBody({
      appVersion: "4.1.0",
      osname: "ios",
      osVersion: "17.4",
      model: "iPhone15,3",
      locale: "en-AU",
      freeBytes: 13_421_772_800, // exactly 12.5 GiB
    });

    expect(body).to.equal(
      "App version:  4.1.0\n" +
      "OS:           ios 17.4\n" +
      "Phone model:  iPhone15,3\n" +
      "Locale:       en-AU\n" +
      "Free disk:    12.5 GB"
    );
  });
});
