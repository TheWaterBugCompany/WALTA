require("mocha");
const { expect } = require("chai");
const TrayButtonViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/TrayButton");

const topics = { SAMPLETRAY: "sampletray", TRAININGTRAY: "trainingtray" };

describe("TrayButtonViewModel", function () {
  function build(over) {
    return new TrayButtonViewModel(Object.assign({ topics, onSelect: () => {} }, over));
  }

  // Identifying a bug from the menu, or browsing out of an assessment, has no
  // tray behind it to go back to.
  it("stays hidden when the screen was not reached from a tray", function () {
    expect(build({ allowAddToSample: false }).visible).to.be.false;
  });

  it("shows once the screen was reached from a tray", function () {
    expect(build({ allowAddToSample: true }).visible).to.be.true;
  });

  it("goes back to the survey tray during a survey", function () {
    let went = null;
    build({ allowAddToSample: true, onSelect: (t) => (went = t) }).select();
    expect(went).to.equal(topics.SAMPLETRAY);
  });

  it("goes back to the training tray during a training session", function () {
    let went = null;
    build({ allowAddToSample: true, training: true, onSelect: (t) => (went = t) }).select();
    expect(went).to.equal(topics.TRAININGTRAY);
  });
});
