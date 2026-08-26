require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, actionFiresEventTest, waitFor } = require("spec/util/TestUtils");

// iOS only: the inline date picker this modal embeds crashes Titanium's
// Android Material TextInputLayout, so Android uses the native date dialog
// (see Notes controller) and never instantiates this modal.
describe("IosSurveyDatePicker controller", function () {
  var ctl, win;
  beforeEach(async function () {
    if (!OS_IOS) this.skip();
    ctl = Alloy.createController("IosSurveyDatePicker", { date: new Date(2020, 0, 2) });
    win = wrapViewInWindow(ctl.getView());
    await windowOpenTest(win);
  });
  afterEach(async () => { if (win) await closeWindow(win); });

  it("seeds an inline date picker with the given date", function () {
    expect(ctl.datePicker.type).to.equal(Ti.UI.PICKER_TYPE_DATE);
    if (OS_IOS) {
      expect(ctl.datePicker.datePickerStyle).to.equal(Ti.UI.DATE_PICKER_STYLE_INLINE);
    }
  });

  // The inline picker draws a fixed-height calendar, and on a phone in landscape
  // it was tall enough to push the button bar past the bottom of the card — the
  // Done button came out sliced in half by the edge of the screen.
  it("keeps the Done button inside the card, clear of the bottom edge", async function () {
    await waitFor(function () { return ctl.pickerWindow.rect.height > 0; });

    var bar = ctl.buttonBar.rect;
    expect(bar.y + bar.height).to.be.at.most(ctl.pickerWindow.rect.height - 8);
  });

  it("triggers 'selected' with the chosen date when Done is tapped", function (done) {
    ctl.on("selected", function (e) {
      expect(e.value).to.be.a("date");
      done();
    });
    ctl.doneButton.fireEvent("click");
  });

  it("triggers 'close' when the close button is tapped", async () =>
    actionFiresEventTest(ctl.closeButton.closeButton, "click", ctl, "close")
  );
});
