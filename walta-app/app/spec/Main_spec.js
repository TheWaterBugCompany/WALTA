require("spec/lib/ti-mocha");
var simple = require("spec/lib/simple-mock");
var { expect } = require("spec/lib/chai");
var { makeSampleData } = require("spec/fixtures/SampleData_fixture");
var { clearDatabase, actionFiresTopicTest, waitForTick, isManualTests } = require("spec/util/TestUtils");
var { areWeSyncing } = require("logic/SampleSync");
var { Navigation } = require('logic/Navigation');
var { Survey } = require('logic/Survey');
var { View } = require('logic/View');
var Topics = require('ui/Topics');
var KeyLoader = require('logic/KeyLoaderJson');
var { makeTestServices } = require('spec/fixtures/Services_fixture');
describe("Main controller", function() {
	let app;
  Alloy.Collections.instance("taxa");
  let keyUrl = Ti.Filesystem.resourcesDirectory + "taxonomy/walta/";
  let key = KeyLoader.loadKey(keyUrl);
  let services = makeTestServices({ Key: key, Survey: Survey });
  services.View = new View(services);
  services.Survey.uploadNewSample = function() {};
  beforeEach(function() {
    simple.mock(services.Survey.uploadNewSample).returnWith();
  })
  services.Navigation = new Navigation(services);
  function currentController() {
    return services.View.getCurrentController();
  }
  // The sample edit menu is a modal now (row-select fires EDIT_SAMPLE).
  function sampleMenu() {
    return services.View.getCurrentModal().alloyCtl;
  }
  afterEach(function() {
    if ( ! isManualTests() ) {
      currentController().TopLevelWindow.close();
    }
    Topics.reset(); // remove global events handlers
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
    currentController().sampleTable.data[0].rows[0].fireEvent("click");

    await waitForTick(10)();
    await actionFiresTopicTest( sampleMenu().edit, "click", Topics.PAGE_OPENED );
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
    currentController().sampleTable.data[0].rows[0].fireEvent("click");
    await actionFiresTopicTest( sampleMenu().edit, "click", Topics.PAGE_OPENED );

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

    currentController().sampleTable.data[0].rows[0].fireEvent("click");

    
    await actionFiresTopicTest( sampleMenu().view, "click", Topics.PAGE_OPENED );

    // verify change has been persisted
    expect( currentController().waterbodyNameField.value ).to.equal("changed by test edit");

  });

 
});