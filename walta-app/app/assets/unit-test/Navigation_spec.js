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
var simple = require("unit-test/lib/simple-mock");
var { closeWindow, controllerOpenTest } = require("unit-test/util/TestUtils");
var { Navigation } = require('logic/Navigation');
describe("logic/Navigation service", function() {
  let services = {
    Key: {},
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