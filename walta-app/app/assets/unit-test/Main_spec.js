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
var { clearDatabase, actionFiresTopicTest, waitForTick, isManualTests } = require("unit-test/util/TestUtils");
var { areWeSyncing } = require("logic/SampleSync");
var Topics = require('ui/Topics');
var KeyLoader = require('logic/KeyLoaderJson');
describe("Main controller", function() {
	var app;
  let currentController = null;
    function createMockMain() {
          // FIXME: Sampletray needs global taxa collection
          Alloy.Collections.instance("taxa");
          var keyUrl = Ti.Filesystem.resourcesDirectory + "taxonomy/walta/";
          var key = KeyLoader.loadKey(keyUrl);
          return Alloy.createController("Main", {
              System: {
                  requestPermission: function(p,cb) { cb({success:true})},
                  closeApp: function() {},
              },
              View: {
                  openView: function(ctl,args) {
                    Ti.API.info(`openView ${ctl}`);
                      var controller = Alloy.createController(ctl,args);
                      controller.open();
                      currentController = controller;
                  }
              },
              Key: key,
              Survey: {
                  forceUpload: function() {},
                  startSurvey: function() {}
              }
          });
      }
      afterEach(function() {
        if ( ! isManualTests() ) {
          currentController.TopLevelWindow.close();
        }
        Alloy.Events.off(); // remove global events handlers
      });
	it('should display the Main view', async function() {
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
      .returnWith({accessToken:"accessToken"});
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    app = createMockMain();
    app.startApp();
    expect(app.getHistory()[0].ctl).to.equal("Menu");
  });
  // impossible to code this test because alertDialog is blocking??
  it.only('should display discard/save notification when leaving unsaved sample', async function() {
    clearDatabase();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
      .returnWith({accessToken:"accessToken"});
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    makeSampleData({ serverSampleId: 666 }).save();
    app = createMockMain();
    app.startApp();
    await waitForTick(10)();
    currentController.history.fireEvent("click");
    currentController.sampleTable.fireEvent("click", { index: 0 });
    await actionFiresTopicTest( currentController.sampleMenu.edit.getView(), "click", Topics.PAGE_OPENED );
    currentController.waterbodyNameField.value = "changed by test edit";
    currentController.waterbodyNameField.fireEvent("change"); // simulate user entering text
    // simulate leaving edit wizard
    await actionFiresTopicTest( currentController.getAnchorBar().home, "click", Topics.DISCARD_OR_SAVE );
    // dialogue should be open
    expect(app.saveOrDiscard).to.be.ok;
    // select the discard buttion
    app.saveOrDiscard.fireEvent('click',{index:0});
    expect(currentController.name).to.equal("home");


  });
  it('should allow a sample to be edited', async function() {
    clearDatabase();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
      .returnWith({accessToken:"accessToken"});
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    makeSampleData({ serverSampleId: 666 }).save();
    app = createMockMain();
    app.startApp();
    currentController.history.fireEvent("click");
    currentController.sampleTable.fireEvent("click", { index: 0 });
    await actionFiresTopicTest( currentController.sampleMenu.edit.getView(), "click", Topics.PAGE_OPENED );

    // At this point the global sample SHOULD NOT be the original record but 
    // a temporary copy instead. This a new sample with the DateSubmitted field blank.
    expect( Alloy.Models.instance("sample").get("serverSampleId")).to.equal(666);
    expect( Alloy.Models.instance("sample").get("dateCompleted")).to.be.undefined;

    currentController.waterbodyNameField.value = "changed by test edit";
    currentController.waterbodyNameField.fireEvent("change"); // simulate user entering text
   
  
    await actionFiresTopicTest( currentController.nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController.name).to.equal("habitat")
    await actionFiresTopicTest( currentController.nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController.name).to.equal("sampletray")
    await actionFiresTopicTest( currentController.nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController.name).to.equal("notes")
    await actionFiresTopicTest( currentController.nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController.name).to.equal("summary")
    await actionFiresTopicTest( currentController.nextButton.NavButton, "click", Topics.PAGE_OPENED );

    // load original row from archive (should only list submitted surveys)
    await actionFiresTopicTest( currentController.getAnchorBar().home, "click", Topics.PAGE_OPENED );
    currentController.history.fireEvent("click");
    
    expect( currentController.sampleTable.data[0].rows.length, "there should only be one row" ).to.equal(1);

    currentController.sampleTable.fireEvent("click", { index: 0 });

    
    await actionFiresTopicTest( currentController.sampleMenu.view.getView(), "click", Topics.PAGE_OPENED );

    // verify change has been persisted
    expect( currentController.waterbodyNameField.value ).to.equal("changed by test edit");

  });

 
});