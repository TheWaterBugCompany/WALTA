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
var { expect } = require("unit-test/lib/chai");
var { makeSampleData } = require("unit-test/fixtures/SampleData_fixture");
var { clearDatabase, actionFiresTopicTest } = require("unit-test/util/TestUtils");
var Topics = require('ui/Topics');
describe.only("Main controller", function() {
	var app;
	it('should display the Main view', async function() {
    app = Alloy.createController("Main");
    app.startApp();
    expect(app.getHistory()[0].ctl).to.equal("Menu");
  });
  it.only('should allow a sample to be edited', async function() {
    clearDatabase();
    makeSampleData({ serverSampleId: 666 }).save();
    app = Alloy.createController("Main");
    app.startApp();
    app.getCurrentController()
      .history.fireEvent("click");
    let archive = app.getCurrentController();
    archive.sampleTable.fireEvent("click", { index: 0 });
    await actionFiresTopicTest( archive.sampleMenu.edit.getView(), "click", Topics.SITEDETAILS );

    // At this point the global sample SHOULD NOT be the original record but 
    // a temporary copy instead. This a new sample with the DateSubmitted field blank.
    expect( Alloy.Models.instance("sample").get("serverSampleId")).to.equal(666);
    expect( Alloy.Models.instance("sample").get("dateCompleted")).to.be.null;
    


  });
});