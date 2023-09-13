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
var Topics = require('ui/Topics');
var simple = require("unit-test/lib/simple-mock");
var { expect } = require("unit-test/lib/chai");
var { closeWindow, controllerOpenTest, waitForTick, isManualTests, waitForTopic } = require("unit-test/util/TestUtils");
var { Navigation } = require('logic/Navigation');
var { View } = require('logic/View');
describe("Notes controller", function () {
  beforeEach(function () {
    Alloy.Models.instance("sample").clear();
    Alloy.Models.instance("sample").set("complete", true);
    Alloy.Models.sample.set("notes", "test notes");
  });
  context("view test", function () {
    var ctl;
    beforeEach(function () {
      ctl = Alloy.createController("Notes");
    });
    afterEach(function (done) {
      closeWindow(ctl.getView(), done);
    });
    it('should display the Notes view', async function () {
      await controllerOpenTest(ctl);
      expect(ctl.partialToggle.enabled).to.be.true;
      expect(ctl.notesTextField.editable).to.be.true;
    });
    it('should bind the partial submission checkbox to the partial field in the sample', async function () {

      await controllerOpenTest(ctl);
      expect(ctl.partialToggle.value).to.equal(true);
      ctl.partialToggle.value = false;
      await waitForTick(10)();
      expect(Alloy.Models.instance("sample").get("complete")).to.equal(false);
    });
    it('should bind the notes field to the notes field in the sample model', async function () {

      await controllerOpenTest(ctl);
      expect(ctl.notesTextField.value).to.equal("test notes");
      ctl.notesTextField.value = "edit";
      // no way to simulate actual entering keypresses but
      // assuming the change event is fired this tests the
      // setting of the notes field.
      ctl.notesTextField.fireEvent("change", { value: "edit" });
      await waitForTick(10)();
      let notes = Alloy.Models.sample.get("notes");
      expect(notes).to.equal("edit");
    });
    it('should not be able to edit partial or notes in read only mode', async function () {
      ctl = Alloy.createController("Notes", { readonly: true });
      await controllerOpenTest(ctl);
      expect(ctl.partialToggle.enabled).to.be.false;
      expect(ctl.notesTextField.editable).to.be.false;
    });
  });

  context("main integration", function () {
    let mockKey = { getSpeedbugIndex: function () { } };
    let services = {
      System: {
        requestPermission: function () { return Promise.resolve({success:true}) },
        closeApp: function () { },
      },
      Key: mockKey,
      Survey: {
        forceUpload: function () { },
        startSurvey: function () { }
      }
    }
    services.View = new View(services);
    Alloy.Collections.instance("taxa");
    services.Navigation = new Navigation(services);
    function currentController() {
      return services.View.getCurrentController();
    };
    afterEach(function () {
      if ( ! isManualTests() ) {
        currentController().TopLevelWindow.close();
        Alloy.Events.off(); // remove global events handlers
      }
    });
    it('should move from the sample tray to the notes screen', async function () {
      let main = Alloy.createController("Main", services);
      await main.startApp();
      await services.Navigation.openController("SampleTray", {});
      expect(currentController().name).to.equal("sampletray");
      await waitForTopic(Topics.PAGE_OPENED,
          () => currentController().nextButton.NavButton.fireEvent("click") );
      expect(currentController().name).to.equal("notes");
      await waitForTopic(Topics.PAGE_OPENED,
        () => currentController().backButton.NavButton.fireEvent("click") );
      expect(currentController().name).to.equal("sampletray");

    });
    it('should move from the notes screen to the summary screen', async function () {
      let main = Alloy.createController("Main", services);
      await main.startApp();
      await services.Navigation.openController("Notes", {});
      expect(currentController().name).to.equal("notes");
      currentController().nextButton.NavButton.fireEvent("click");
      await waitForTick(10)();
      expect(currentController().name).to.equal("summary");
      currentController().backButton.NavButton.fireEvent("click");
      await waitForTick(10)();
      expect(currentController().name).to.equal("notes");
    });
  });
});