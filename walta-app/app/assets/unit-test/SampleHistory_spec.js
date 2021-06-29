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
var Topics = require('ui/Topics');
var { expect } = require("unit-test/lib/chai");
var { makeSampleData } = require("unit-test/fixtures/SampleData_fixture");
var { clearDatabase, closeWindow, controllerOpenTest, actionFiresTopicTest } = require("unit-test/util/TestUtils");
var moment = require("lib/moment");

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

});