/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("unit-test/lib/ti-mocha");
var simple = require("unit-test/lib/simple-mock");
var { expect } = require("unit-test/lib/chai");
var { makeSampleData } = require("unit-test/fixtures/SampleData_fixture");
var { clearDatabase, actionFiresTopicTest, waitFor } = require("unit-test/util/TestUtils");
var { areWeSyncing } = require("logic/SampleSync");
var Topics = require('ui/Topics');
describe("Main controller", function() {
	var app;
	it('should display the Main view', async function() {
    app = Alloy.createController("Main");
    app.startApp({nosync: true});
    expect(app.getHistory()[0].ctl).to.equal("Menu");
  });
  it('should allow a sample to be edited', async function() {
    clearDatabase();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    makeSampleData({ serverSampleId: 666 }).save();
    app = Alloy.createController("Main");
    app.startApp({nosync: true});
    app.getCurrentController()
      .history.fireEvent("click");
    let archive = app.getCurrentController();
    archive.sampleTable.fireEvent("click", { index: 0 });
    await actionFiresTopicTest( archive.sampleMenu.edit.getView(), "click", Topics.PAGE_OPENED );

    // At this point the global sample SHOULD NOT be the original record but 
    // a temporary copy instead. This a new sample with the DateSubmitted field blank.
    expect( Alloy.Models.instance("sample").get("serverSampleId")).to.equal(666);
    expect( Alloy.Models.instance("sample").get("dateCompleted")).to.be.undefined;

    let siteDetails = app.getCurrentController();

    siteDetails.waterbodyNameField.value = "changed by test edit";
    siteDetails.waterbodyNameField.fireEvent("change"); // simulate user entering text
   
    await actionFiresTopicTest( siteDetails.nextButton.NavButton, "click", Topics.PAGE_OPENED );

    let habitat = app.getCurrentController();
   
    await actionFiresTopicTest( habitat.nextButton.NavButton, "click", Topics.PAGE_OPENED );

    let sampleTray = app.getCurrentController();
    await actionFiresTopicTest( sampleTray.nextButton.NavButton, "click", Topics.PAGE_OPENED );

    let summary = app.getCurrentController();
    await actionFiresTopicTest( summary.nextButton.NavButton, "click", Topics.PAGE_OPENED );

    
    
    // load original row from archive (should only list submitted surveys)
    let login = app.getCurrentController();
    await actionFiresTopicTest( login.getAnchorBar().home, "click", Topics.PAGE_OPENED );
    app.getCurrentController().history.fireEvent("click");
    

    archive = app.getCurrentController();
    expect( archive.sampleTable.data[0].rows.length, "there should only be one row" ).to.equal(1);

    archive.sampleTable.fireEvent("click", { index: 0 });
    
    await actionFiresTopicTest( archive.sampleMenu.view.getView(), "click", Topics.PAGE_OPENED );

    // verify change has been persisted
    siteDetails = app.getCurrentController();
    expect( siteDetails.waterbodyNameField.value ).to.equal("changed by test edit");

  });

 
});