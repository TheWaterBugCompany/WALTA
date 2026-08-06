require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var simple = require("spec/lib/simple-mock");
var { closeWindow, controllerOpenTest } = require("spec/util/TestUtils");
var { Navigation } = require('logic/Navigation');
var Logger = require('util/Logger');
describe("logic/Navigation service", function() {
  let services = {
    Key: {},
    topics: { SURVEY_STARTED: "surveystarted", subscribe: function(){} },
    View: {
      openView: function(){},
      askDiscardEdits: function(){}
    },
    System: {
      closeApp: function() {}
    },
    Survey: {
      hasUnsavedChanges: function() {
        return true;
      },
      discardSurvey: function() {

      },
      submitSurvey: function() {

      }
    }
  }
  beforeEach( function() {
    simple.restore();
    simple.mock(services.View, "askDiscardEdits").resolveWith("discard");
  });
  it('logs a navigation breadcrumb naming the opened controller', async function() {
    var captured = [];
    var unsubscribe = Logger.subscribe({ facility: "navigation" }, e => captured.push(e));
    try {
      let nav = new Navigation(services);
      await nav.openController("SiteDetails");
      expect(captured.some(e => e.message.indexOf("SiteDetails") >= 0)).to.equal(true);
    } finally {
      unsubscribe();
    }
  });

  it('should not ask to discard when tranistion to SiteDetails',async function() {
    let nav = new Navigation(services);
    
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.openController("OtherScreen");
    await nav.openController("OtherScreen2");
    await nav.openController("Habitat");
    await nav.openController("SiteDetails");
    expect(services.View.askDiscardEdits.callCount).to.equal(0);
  });

  it('should not ask to discard when not transitioning to a historical screen',async function() {
    let nav = new Navigation(services);
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.openController("KeyNode");
    await nav.openController("OtherScreen");
    await nav.openController("OtherScreen2");
    await nav.openController("Habitat");
    expect(services.View.askDiscardEdits.callCount).to.equal(0);
  });

	it('should call ask user to discard edits if SiteDetails is removed from history', async function() {
    let nav = new Navigation(services);
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.openController("Menu");
    expect(services.View.askDiscardEdits.callCount).to.equal(1);
  });

  it('should call ask user to discard edits if SiteDetails is removed from history via goBack()', async function() {
    let nav = new Navigation(services);
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.goBack();
    await nav.goBack();
    expect(services.View.askDiscardEdits.callCount).to.equal(1);
  });

  it('should not ask user to discard edits if sample is saved', async function() {
    simple.mock(services.Survey, "hasUnsavedChanges").returnWith(false);
    let nav = new Navigation(services);
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.openController("Menu");
    expect(services.View.askDiscardEdits.callCount).to.equal(0);
  })

  it('should call discard when user discards record',async function() {
    simple.mock(services.Survey, "discardSurvey");
    let nav = new Navigation(services);
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.openController("Menu");
    expect(services.Survey.discardSurvey.callCount).to.equal(1);
  })

  it('should submit record if user selects submit',async function() {
    simple.mock(services.Survey, "submitSurvey");
    simple.mock(services.View,"askDiscardEdits").resolveWith('submit');
    let nav = new Navigation(services);
    await nav.openController("Menu");
    await nav.openController("SiteDetails");
    await nav.openController("Habitat");
    await nav.openController("Menu");
    expect(services.Survey.submitSurvey.callCount).to.equal(1);
  })
  
});