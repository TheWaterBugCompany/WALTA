require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var simple = require("spec/lib/simple-mock");
var { Survey } = require("logic/Survey");
var { clearDatabase, resetSample, waitForTopic } = require("spec/util/TestUtils");
var { makeSampleData } = require("spec/fixtures/SampleData_fixture");
var Topics = require('ui/Topics');
var Sample = require('logic/Sample');

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

// Reopening an unfinished survey has to hand its consumers that survey's taxa:
// EditTaxon and the tray work off the collection SURVEY_STARTED carries, so a
// collection that doesn't belong to the reopened sample shows an empty tray and
// reads as the identifications having been lost.
describe("logic/Survey reopening an unfinished survey", function () {
  let savedApi;

  beforeEach(function () {
    clearDatabase();
    savedApi = Alloy.Globals.CerdiApi;
    Alloy.Globals.CerdiApi = { retrieveUserId: () => 38 };
  });

  afterEach(function () {
    Alloy.Globals.CerdiApi = savedApi;
  });

  it("startSurvey hands over the taxa of the survey it reopened", async function () {
    let inFlight = makeSampleData({ dateCompleted: null, serverSampleId: null });
    inFlight.save();
    // load() only sees a taxon that has been through a save (updatedAt set)
    Alloy.createModel("taxa", {
      sampleId: inFlight.get("sampleId"), taxonId: 1, abundance: "1-2", updatedAt: 1,
    }).save();

    // what a fresh launch does: resume whatever was left unfinished
    resetSample();
    await Alloy.Models.instance("sample").loadCurrent();

    let started = await waitForTopic( Topics.SURVEY_STARTED,
      () => Survey.startSurvey( Sample.SURVEY_DETAILED ) );

    expect( started.sample.get("sampleId"), "reopens the unfinished survey" )
      .to.equal( inFlight.get("sampleId") );
    expect( started.taxa.length, "carrying its identifications" ).to.equal(1);
  });
});
