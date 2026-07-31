require("spec/lib/ti-mocha");
var Topics = require('ui/Topics');
var simple = require("spec/lib/simple-mock");
var { use, expect } = require("spec/lib/chai");
use( require('spec/lib/chai-falsy') );
var { closeWindow, controllerOpenTest, waitForTick, isManualTests, waitForTopic } = require("spec/util/TestUtils");
var { Navigation } = require('logic/Navigation');
var { View } = require('logic/View');
var { makeTestServices } = require('spec/fixtures/Services_fixture');
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
    it('defaults the survey date field to today', async function () {
      await controllerOpenTest(ctl);
      let today = require("lib/moment")().format("D MMMM YYYY");
      expect(ctl.surveyDateValue.text).to.equal(today);
    });
    it('persists a chosen survey date to the sample and updates the field', async function () {
      await controllerOpenTest(ctl);
      ctl.selectSurveyDate(new Date(2020, 0, 2, 3, 4, 5));
      await waitForTick(10)();
      expect(ctl.surveyDateValue.text).to.equal("2 January 2020");
      let stored = Alloy.Models.sample.get("overrideDateCompleted");
      expect(require("lib/moment")(stored).format("D MMMM YYYY")).to.equal("2 January 2020");
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
    it('should not open the survey date picker in read only mode', async function () {
      ctl = Alloy.createController("Notes", { readonly: true });
      await controllerOpenTest(ctl);
      ctl.surveyDateField.fireEvent("click");
      await waitForTick(10)();
      expect(ctl.surveyDatePicker, "read-only must not open the date picker").to.not.exist;
    });
  });

  // iOS only: Android opens the native date dialog (showDatePickerDialog),
  // a fire-and-forget native call with no modal to introspect. Skipping in a
  // beforeEach keeps the window unopened, so the afterEach must guard on ctl.
  context("inline calendar modal (iOS)", function () {
    var ctl;
    beforeEach(async function () {
      if (!OS_IOS) this.skip();
      ctl = Alloy.createController("Notes");
      await controllerOpenTest(ctl);
    });
    afterEach(function (done) {
      if (ctl) closeWindow(ctl.getView(), done);
      else done();
    });
    it('opens when the survey date field is tapped', async function () {
      expect(ctl.surveyDatePicker, "no modal before tapping").to.not.exist;
      ctl.surveyDateField.fireEvent("click");
      await waitForTick(10)();
      expect(ctl.surveyDatePicker, "tapping the field opens the picker modal").to.exist;
      expect(ctl.surveyDatePicker.datePicker.type).to.equal(Ti.UI.PICKER_TYPE_DATE);
      expect(ctl.surveyDatePicker.datePicker.datePickerStyle).to.equal(Ti.UI.DATE_PICKER_STYLE_INLINE);
    });
  });

  context("main integration", function () {
    let mockKey = { getSpeedbugIndex: function () { } };
    let services = makeTestServices({
      Key: mockKey,
      Survey: {
        uploadNewSample: function () { },
        startSurvey: function () { }
      }
    })
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
