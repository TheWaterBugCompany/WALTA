require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var simple = require("spec/lib/simple-mock");
var { Survey } = require("logic/Survey");

// The survey consumers must act on the sample threaded to them (the edit flow
// hands them a temporary edit copy), not reach back to the Alloy singleton.
describe("logic/Survey", function () {
  let given, singleton;

  beforeEach(function () {
    given = Alloy.createModel("sample");
    singleton = Alloy.Models.instance("sample");
    expect(given).to.not.equal(singleton);
  });

  afterEach(function () {
    simple.restore();
  });

  it("submitSurvey saves the given sample, not the singleton", async function () {
    simple.mock(given, "saveCurrentSample").resolveWith();
    simple.mock(singleton, "saveCurrentSample").resolveWith();
    await Survey.submitSurvey(given);
    expect(given.saveCurrentSample.callCount, "given saved").to.equal(1);
    expect(singleton.saveCurrentSample.callCount, "singleton not saved").to.equal(0);
  });

  it("discardSurvey destroys the given sample, not the singleton", function () {
    simple.mock(given, "destroy");
    simple.mock(singleton, "destroy");
    Survey.discardSurvey(given);
    expect(given.destroy.callCount, "given destroyed").to.equal(1);
    expect(singleton.destroy.callCount, "singleton not destroyed").to.equal(0);
  });

  it("hasUnsavedChanges reads the given sample", async function () {
    simple.mock(given, "hasUnsavedChanges").returnWith(true);
    simple.mock(singleton, "hasUnsavedChanges").returnWith(false);
    expect(await Survey.hasUnsavedChanges(given)).to.equal(true);
  });

  it("isNewSurvey reads the given sample", function () {
    simple.mock(given, "isNewSurvey").returnWith(true);
    simple.mock(singleton, "isNewSurvey").returnWith(false);
    expect(Survey.isNewSurvey(given)).to.equal(true);
  });
});
