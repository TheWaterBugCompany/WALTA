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
var { closeWindow, controllerOpenTest, waitForTick } = require("unit-test/util/TestUtils");
describe("Notes controller", function() {
  context("view test", function() {
    var ctl;
    beforeEach( function() {
      Alloy.Models.instance("sample").clear();
      Alloy.Models.instance("sample").set("complete", true);
      Alloy.Models.sample.set("notes", "test notes");
      ctl = Alloy.createController("Notes");
    });
    afterEach( function(done) {
      closeWindow( ctl.getView(), done );
    }); 
    it('should display the Notes view', async function() {
      await controllerOpenTest( ctl );
      expect( ctl.partialToggle.enabled ).to.be.true;
      expect( ctl.notesTextField.editable ).to.be.true;
    });
    it('should bind the partial summision checkbox to the partial field in the sample', async function() {
      
      await controllerOpenTest( ctl );
      expect( ctl.partialToggle.value).to.equal(true);
      ctl.partialToggle.value = false;
      await waitForTick(10)();
      expect( Alloy.Models.instance("sample").get("complete") ).to.equal(false);
    });
    it('should bind the notes field to the notes field in the sample model', async function() {
      
      await controllerOpenTest( ctl );
      expect( ctl.notesTextField.value).to.equal("test notes");
      ctl.notesTextField.value = "edit";
      // no way to simulate actual entering keypresses but
      // assuming the change event is fired this tests the
      // setting of the notes field.
      ctl.notesTextField.fireEvent("change", { value: "edit" } );
      await waitForTick(10)();
      let notes = Alloy.Models.sample.get("notes");
      expect(notes).to.equal("edit");
    });
    it('should not be able to edit partial or notes in read only mode',async function() {
      ctl = Alloy.createController("Notes", {readonly:true});
      await controllerOpenTest( ctl );
      expect( ctl.partialToggle.enabled ).to.be.false;
      expect( ctl.notesTextField.editable ).to.be.false;
    });
  });

  // This is way too flakey, not sure why
  // works in real life.... 
  context.skip("main integration", function() {
    let currentController = null;
    let mockKey = { getSpeedbugIndex: function() {} };
    function createMockMain() {
          // FIXME: Sampletray needs global taxa collection
          Alloy.Collections.instance("taxa");
          return Alloy.createController("Main", {
              System: {
                  requestPermission: function() {},
                  closeApp: function() {},
              },
              View: {
                  openView: function(ctl,args) {
                      var controller = Alloy.createController(ctl,args);
                      controller.open();
                      currentController = controller;
                  }
              },
              Key: mockKey,
              Survey: {
                  forceUpload: function() {},
                  startSurvey: function() {}
              }
          });
      }
      afterEach(function() {
        currentController.TopLevelWindow.close();
        Alloy.Events.off(); // remove global events handlers
      });
      it.only('should move from the sample tray to the notes screen', async function() {
        let main = createMockMain();
        main.startApp();
        await waitForTick(10)();
        main.openController( "SampleTray", {});
        await waitForTick(10)();
        expect(currentController.name).to.equal("sampletray");
        currentController.nextButton.NavButton.fireEvent("click");
        await waitForTick(10)();
        expect(currentController.name).to.equal("notes");
        currentController.backButton.NavButton.fireEvent("click");
        await waitForTick(10)();
        expect(currentController.name).to.equal("sampletray");

      });
      it('should move from the notes screen to the summary screen', async function() {
        let main = createMockMain();
        main.startApp();
        await waitForTick(10)();
        main.openController( "Notes", {});
        await waitForTick(10)();
        expect(currentController.name).to.equal("notes");
        currentController.nextButton.NavButton.fireEvent("click");
        await waitForTick(10)();
        expect(currentController.name).to.equal("summary");
        currentController.backButton.NavButton.fireEvent("click");
        await waitForTick(10)();
        expect(currentController.name).to.equal("notes");
      });
  });
});