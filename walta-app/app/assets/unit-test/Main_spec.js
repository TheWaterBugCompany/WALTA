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
var { Navigation } = require('logic/Navigation');
var { Survey } = require('logic/Survey');
var { View } = require('logic/View');
var Topics = require('ui/Topics');
var KeyLoader = require('logic/KeyLoaderJson');
describe("Main controller", function() {
	let app;
  Alloy.Collections.instance("taxa");
  let keyUrl = Ti.Filesystem.resourcesDirectory + "taxonomy/walta/";
  let key = KeyLoader.loadKey(keyUrl);
  let services = {
      System: {
          requestPermission: function(p) { return Promise.resolve({success:true})},
          closeApp: function() {},
      },
      View: View,
      Key: key,
      Survey: Survey
  }
  services.Survey.forceUpload = function() {};
  beforeEach(function() {
    simple.mock(services.Survey.forceUpload).returnWith();
  })
  services.Navigation = new Navigation(services);
  function currentController() { 
    return services.View.getCurrentController();
  }
  afterEach(function() {
    if ( ! isManualTests() ) {
      currentController().TopLevelWindow.close();
    }
    Alloy.Events.off(); // remove global events handlers
    simple.restore();
  });

	it('should display the Main view', async function() {
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
      .returnWith({accessToken:"accessToken"});
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    app = Alloy.createController("Main", services);
    await app.startApp();
    expect(services.Navigation.getHistory()[0].ctl).to.equal("Menu");
  });

  it('should display discard/save notification when leaving unsaved sample', async function() {
    clearDatabase();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
      .returnWith({accessToken:"accessToken"});
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    makeSampleData({ serverSampleId: 666 }).save();
    app = Alloy.createController("Main", services);
    await app.startApp();
    await actionFiresTopicTest( currentController().history, "click", Topics.PAGE_OPENED );
    currentController().sampleTable.fireEvent("click", { index: 0 });

    await waitForTick(10)();
    await actionFiresTopicTest( currentController().sampleMenu.edit.getView(), "click", Topics.PAGE_OPENED );
    currentController().waterbodyNameField.value = "changed by test edit";
    currentController().waterbodyNameField.fireEvent("change"); // simulate user entering text

    // simulate leaving edit wizard
    await actionFiresTopicTest( currentController().getAnchorBar().home, "click", Topics.DISCARD_OR_SAVE );
   
    
    // dialogue should be open
   
    let discardDialog = services.View.getSaveOrDiscard();
    expect(discardDialog).to.be.ok;
    // select the discard buttion
    discardDialog.fireEvent('click',{index:1});
    await waitForTick(10)(); 
    expect(currentController().name).to.equal("home");


  });

  it('should allow a sample to be edited', async function() {
    clearDatabase();
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserToken")
      .returnWith({accessToken:"accessToken"});
    simple.mock(Alloy.Globals.CerdiApi,"retrieveUserId")
      .returnWith(38);
    makeSampleData({ serverSampleId: 666 }).save();
    app = Alloy.createController("Main", services);
    await app.startApp();
   
    await actionFiresTopicTest( currentController().history, "click", Topics.PAGE_OPENED);
    currentController().sampleTable.fireEvent("click", { index: 0 });
    await actionFiresTopicTest( currentController().sampleMenu.edit.getView(), "click", Topics.PAGE_OPENED );

    // At this point the global sample SHOULD NOT be the original record but 
    // a temporary copy instead. This a new sample with the DateSubmitted field blank.
    expect( Alloy.Models.instance("sample").get("serverSampleId")).to.equal(666);
    expect( Alloy.Models.instance("sample").get("dateCompleted")).to.be.undefined;

    currentController().waterbodyNameField.value = "changed by test edit";
    currentController().waterbodyNameField.fireEvent("change"); // simulate user entering text
  
    await actionFiresTopicTest( currentController().nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController().name).to.equal("habitat")
    await actionFiresTopicTest( currentController().nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController().name).to.equal("sampletray")
    await actionFiresTopicTest( currentController().nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController().name).to.equal("notes")
    await actionFiresTopicTest( currentController().nextButton.NavButton, "click", Topics.PAGE_OPENED );
    expect(currentController().name).to.equal("summary")
    await actionFiresTopicTest( currentController().nextButton.NavButton, "click", Topics.FORCE_UPLOAD );
     // load original row from archive (should only list submitted surveys)
    await actionFiresTopicTest( currentController().getAnchorBar().home, "click", Topics.PAGE_OPENED );
    
    await actionFiresTopicTest( currentController().history, "click", Topics.PAGE_OPENED);
    
    expect( currentController().sampleTable.data[0].rows.length, "there should only be one row" ).to.equal(1);

    currentController().sampleTable.fireEvent("click", { index: 0 });

    
    await actionFiresTopicTest( currentController().sampleMenu.view.getView(), "click", Topics.PAGE_OPENED );

    // verify change has been persisted
    expect( currentController().waterbodyNameField.value ).to.equal("changed by test edit");

  });

 
});