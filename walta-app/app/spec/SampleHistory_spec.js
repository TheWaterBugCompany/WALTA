require("spec/lib/ti-mocha");
var simple = require("spec/lib/simple-mock");
var Topics = require('ui/Topics');
var { expect } = require("spec/lib/chai");
var { makeSampleData } = require("spec/fixtures/SampleData_fixture");
var { clearDatabase, closeWindow, controllerOpenTest, actionFiresTopicTest } = require("spec/util/TestUtils");
var moment = require("lib/moment");
var SampleSync = require('logic/SampleSync');

describe("SampleHistory controller", function() {
	var ctl;
	beforeEach( function() {
    clearDatabase();
    makeSampleData({ serverSampleId: 666, dateCompleted: moment("2021-06-21T20:23").format() }).save();
    makeSampleData({ serverSampleId: 667, dateCompleted: moment("2021-06-21T22:23").format() }).save();
    makeSampleData({ serverSampleId: 668, dateCompleted: moment("2021-06-21T23:23").format() }).save();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
		ctl = Alloy.createController("SampleHistory");

	});
	afterEach( function(done) {
    closeWindow( ctl.getView(), done );
    simple.restore();
	});
	it('should display the SampleHistory view', async function() {

		await controllerOpenTest( ctl );
  });
  it('selecting row should open menu', async function() {
    await controllerOpenTest( ctl );
    ctl.sampleTable.data[0].rows[0].fireEvent("click");
    expect( ctl.sampleMenu.view.accessibilityLabel ).to.include("View");
  });
  it('selecting view should raise view event', async function() {
    await controllerOpenTest( ctl );
    ctl.sampleTable.data[0].rows[0].fireEvent("click");
    let result = await actionFiresTopicTest( ctl.sampleMenu.view, "click", Topics.SITEDETAILS );
    expect( result.readonly ).to.be.true;

  });
  it('selecting edit should raise edit event', async function() {
    await controllerOpenTest( ctl );
    ctl.sampleTable.data[0].rows[0].fireEvent("click");
    let result = await actionFiresTopicTest( ctl.sampleMenu.edit, "click", Topics.SITEDETAILS );
    expect( result.readonly ).to.be.false;
  });
  it('places a Sync button on the anchor bar toolbar', async function() {
    await controllerOpenTest( ctl );
    expect( ctl.syncButton ).to.exist;
    expect( ctl.syncButton.label.text ).to.equal("SYNC");
    expect( ctl.syncButton.label.accessibilityLabel ).to.equal("Sync");
  });
  it('clicking the Sync button opens the SyncFeedback popup', async function() {
    Alloy.Globals.CerdiApi.retrieveUserToken = function() { return null; };
    simple.mock(SampleSync, "forceSync");
    await controllerOpenTest( ctl );
    ctl.syncButton.NavButton.fireEvent("click");
    expect( ctl.syncFeedback ).to.exist;
  });

  it('closes the SyncFeedback popup when the session is logged out', async function() {
    Alloy.Globals.CerdiApi.retrieveUserToken = function() { return null; };
    simple.mock(SampleSync, "forceSync");
    await controllerOpenTest( ctl );
    ctl.syncButton.NavButton.fireEvent("click");
    expect( ctl.syncFeedback, "popup should be open before logout" ).to.exist;
    Topics.fireTopicEvent( Topics.LOGGEDOUT, null );
    expect( ctl.syncFeedback, "popup should close on logout" ).to.not.exist;
  });

  it('updates a row VM in place when its UPLOAD_PROGRESS fires', async function() {
    await controllerOpenTest( ctl );
    var rowBefore = ctl.vm.rows[0];
    var sampleId = rowBefore.sampleId;
    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId } );
    expect( ctl.vm.rows[0] ).to.equal( rowBefore );
  });

  it('a reused row still opens its menu after the list reorders during sync', async function() {
    await controllerOpenTest( ctl );

    // A new sample arrives mid-sync and is prepended, reordering the
    // already-rendered (reused) rows — the WB-168 trigger.
    var newSample = makeSampleData({ serverSampleId: 669, dateCompleted: moment("2021-06-22T09:00").format() });
    newSample.save();
    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: newSample.get("sampleId") } );

    // Tapping a reused, shifted row must still open the View/Edit menu.
    var rows = ctl.sampleTable.data[0].rows;
    rows[rows.length - 1].fireEvent("click");
    expect( ctl.sampleMenu, "menu should open for the tapped row" ).to.exist;
    expect( ctl.sampleMenu.view.accessibilityLabel ).to.include("View");
  });

});