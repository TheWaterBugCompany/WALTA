require("spec/lib/ti-mocha");
var simple = require("spec/lib/simple-mock");
var Topics = require('ui/Topics');
var { expect } = require("spec/lib/chai");
var { makeSampleData } = require("spec/fixtures/SampleData_fixture");
var { makeTestServices } = require("spec/fixtures/Services_fixture");
var { clearDatabase, closeWindow, actionFiresTopicTest } = require("spec/util/TestUtils");
var moment = require("lib/moment");
var SampleSync = require('logic/SampleSync');

describe("SampleHistory controller", function() {
	var view, ctl;
	beforeEach( async function() {
    clearDatabase();
    makeSampleData({ serverSampleId: 666, dateCompleted: moment("2021-06-21T20:23").format() }).save();
    makeSampleData({ serverSampleId: 667, dateCompleted: moment("2021-06-21T22:23").format() }).save();
    makeSampleData({ serverSampleId: 668, dateCompleted: moment("2021-06-21T23:23").format() }).save();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId").returnWith(38);
    // Open through View so the Titanium-free lib/mvvm/controllers/SampleHistory
    // wires the view-model and binds the table via the collection binding.
    view = makeTestServices().View;
    await view.openView("SampleHistory", {});
    ctl = view.getCurrentController();
	});
	afterEach( function(done) {
    closeWindow( ctl.getView(), done );
    simple.restore();
	});

	it('should display the SampleHistory view', function() {
    expect( ctl.sampleTable.data[0].rows.length ).to.equal(3);
  });

  // Row selection opens the edit menu via the EDIT_SAMPLE topic (routed by Main
  // to the SampleEditMenu modal); the row owns its own tap.
  it('tapping a row opens the edit menu for that sample', async function() {
    var firstRow = ctl.sampleTable.data[0].rows[0];
    var result = await actionFiresTopicTest( firstRow, "click", Topics.EDIT_SAMPLE );
    expect( result.sampleId ).to.exist;
  });

  it('places a Sync button on the anchor bar toolbar', function() {
    expect( ctl.syncButton ).to.exist;
    expect( ctl.syncButton.label.text ).to.equal("SYNC");
    expect( ctl.syncButton.label.accessibilityLabel ).to.equal("Sync");
  });

  it('clicking the Sync button opens the SyncFeedback popup', function() {
    Alloy.Globals.CerdiApi.retrieveUserToken = function() { return null; };
    simple.mock(SampleSync, "forceSync");
    ctl.syncButton.NavButton.fireEvent("click");
    expect( ctl.syncFeedback ).to.exist;
  });

  it('closes the SyncFeedback popup when the session is logged out', function() {
    Alloy.Globals.CerdiApi.retrieveUserToken = function() { return null; };
    simple.mock(SampleSync, "forceSync");
    ctl.syncButton.NavButton.fireEvent("click");
    expect( ctl.syncFeedback, "popup should be open before logout" ).to.exist;
    Topics.fireTopicEvent( Topics.LOGGEDOUT, null );
    expect( ctl.syncFeedback, "popup should close on logout" ).to.not.exist;
  });

  it('a reused row still opens its menu after the list reorders during sync (WB-168)', async function() {
    // A new sample arrives mid-sync and is prepended, reordering the
    // already-rendered (reused) rows — the WB-168 trigger.
    var newSample = makeSampleData({ serverSampleId: 669, dateCompleted: moment("2021-06-22T09:00").format() });
    newSample.save();
    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: newSample.get("sampleId") } );

    // Tapping a reused, shifted row must still open the edit menu for it — each
    // first-class row owns its own click, so reorder can't drop the dispatch.
    var rows = ctl.sampleTable.data[0].rows;
    var result = await actionFiresTopicTest( rows[rows.length - 1], "click", Topics.EDIT_SAMPLE );
    expect( result.sampleId, "menu opens for the tapped row" ).to.exist;
  });

});
