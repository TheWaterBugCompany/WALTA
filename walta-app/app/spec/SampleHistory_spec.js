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
    ctl.sampleTable.fireEvent("click", { index: 0 } );
    expect( ctl.sampleMenu.view.description.text ).to.include("View");
  });
  it('selecting view should raise view event', async function() {
    await controllerOpenTest( ctl );
    ctl.sampleTable.fireEvent("click", { index: 0 } );
    let result = await actionFiresTopicTest( ctl.sampleMenu.view.getView(), "click", Topics.SITEDETAILS );
    expect( result.readonly ).to.be.true;

  });
  it('selecting edit should raise edit event', async function() {
    await controllerOpenTest( ctl );
    ctl.sampleTable.fireEvent("click", { index: 0 } );
    let result = await actionFiresTopicTest( ctl.sampleMenu.edit.getView(), "click", Topics.SITEDETAILS );
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

  it('updates a row VM in place when its UPLOAD_PROGRESS fires', async function() {
    await controllerOpenTest( ctl );
    var rowBefore = ctl.vm.rows[0];
    var sampleId = rowBefore.sampleId;
    Topics.fireTopicEvent( Topics.UPLOAD_PROGRESS, { id: sampleId } );
    expect( ctl.vm.rows[0] ).to.equal( rowBefore );
  });

});