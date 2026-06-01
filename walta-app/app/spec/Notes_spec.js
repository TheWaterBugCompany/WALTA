require("spec/lib/ti-mocha");
var Topics = require('ui/Topics');
var simple = require("spec/lib/simple-mock");
var { use, expect } = require("spec/lib/chai");
use( require('spec/lib/chai-falsy') );
var { closeWindow, controllerOpenTest, waitForTick, isManualTests, waitForTopic } = require("spec/util/TestUtils");
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
      expect(Alloy.Models.instance("sample").get("complete")).to.be.falsy;
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
        uploadNewSample: function () { },
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
        Topics.reset(); // remove global events handlers
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

describe("WB-143: Notes screen does not flip complete on note-only edit", function () {
  let ctl;
  beforeEach(function () {
    Alloy.Models.instance("sample").clear();
    Alloy.Models.instance("sample").set("complete", false);
    Alloy.Models.sample.set("notes", "original notes");
  });
  afterEach(function (done) {
    if (ctl) closeWindow(ctl.getView(), done);
    else done();
  });

  it("(D) typing into notesTextField leaves sample.complete=false and toggle off", async function () {
    ctl = Alloy.createController("Notes");
    await controllerOpenTest(ctl);

    expect(ctl.partialToggle.value,
      `partialToggle on open with sample.complete=false: ${ctl.partialToggle.value}`)
      .to.equal(false);

    ctl.notesTextField.fireEvent("change", { value: "edit one character" });
    await waitForTick(10)();

    expect(Alloy.Models.instance("sample").get("complete"),
      `sample.complete after note-only edit: ${Alloy.Models.instance("sample").get("complete")}`)
      .to.be.falsy;
  });

  it("(E) toggling partial off persists complete=false and serialises as false on next upload", async function () {
    let { makeSampleData } = require("spec/fixtures/SampleData_fixture");
    let { clearDatabase } = require("spec/util/TestUtils");
    let moment = require("lib/moment");
    clearDatabase();

    Alloy.Models.sample = makeSampleData({
      serverSampleId: 1862,
      complete: 1,
      dateCompleted: moment().format(),
      serverSyncTime: moment().valueOf()
    });
    Alloy.Models.sample.save();
    let id = Alloy.Models.sample.get("sampleId");

    ctl = Alloy.createController("Notes");
    await controllerOpenTest(ctl);
    expect(ctl.partialToggle.value, "toggle starts on for a complete sample").to.equal(true);

    ctl.partialToggle.fireEvent("change", { value: false });
    await waitForTick(10)();

    let reloaded = Alloy.createModel("sample");
    reloaded.loadById(id);
    expect(reloaded.get("complete"),
      `reloaded.complete after toggling off: ${reloaded.get("complete")} (typeof ${typeof reloaded.get("complete")})`)
      .to.be.falsy;
    expect(reloaded.toCerdiApiJson().complete,
      `serialised complete after toggling off: ${reloaded.toCerdiApiJson().complete}`)
      .to.equal(false);
  });
});
