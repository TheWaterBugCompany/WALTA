require("mocha");
const { expect } = require("chai");
const NotesViewModel = require("../../walta-app/app/lib/viewmodels/Notes");

function fakeSample(initial = {}) {
  const state = { ...initial };
  return {
    saves: 0,
    get(key) { return state[key]; },
    set(key, value) { state[key] = value; },
    save() { this.saves++; },
    _state: state
  };
}

describe("NotesViewModel", function () {
  describe("override date", function () {
    it("defaults the override-date toggle to off, picker hidden", function () {
      const vm = new NotesViewModel({ sample: fakeSample() });
      expect(vm.overrideDateEnabled).to.be.false;
      expect(vm.datePickerVisible).to.be.false;
    });

    it("reveals the picker when the override toggle is switched on", function () {
      const vm = new NotesViewModel({ sample: fakeSample() });
      vm.setOverrideDateEnabled(true);
      expect(vm.overrideDateEnabled).to.be.true;
      expect(vm.datePickerVisible).to.be.true;
    });

    it("persists the chosen date to the sample's overrideDateCompleted when enabled", function () {
      const sample = fakeSample();
      const vm = new NotesViewModel({ sample });
      const chosen = new Date("2020-01-02T03:04:05");
      vm.setOverrideDateEnabled(true);
      vm.setOverrideDate(chosen);
      expect(sample.get("overrideDateCompleted")).to.equal(chosen);
    });

    it("clears overrideDateCompleted when the toggle is switched back off", function () {
      const sample = fakeSample();
      const vm = new NotesViewModel({ sample });
      vm.setOverrideDateEnabled(true);
      vm.setOverrideDate(new Date("2020-01-02T03:04:05"));
      vm.setOverrideDateEnabled(false);
      expect(sample.get("overrideDateCompleted")).to.be.null;
    });

    it("reflects an existing override date stored on the sample", function () {
      const sample = fakeSample({ overrideDateCompleted: "2019-05-06T07:08:09+00:00" });
      const vm = new NotesViewModel({ sample });
      expect(vm.overrideDateEnabled).to.be.true;
      expect(vm.datePickerVisible).to.be.true;
    });
  });

  describe("partial submission", function () {
    it("reads the complete flag from the sample as a boolean", function () {
      expect(new NotesViewModel({ sample: fakeSample({ complete: 1 }) }).complete).to.be.true;
      expect(new NotesViewModel({ sample: fakeSample({ complete: 0 }) }).complete).to.be.false;
    });

    it("persists the complete flag as 1/0 when toggled", function () {
      const sample = fakeSample();
      const vm = new NotesViewModel({ sample });
      vm.setComplete(true);
      expect(sample.get("complete")).to.equal(1);
      vm.setComplete(false);
      expect(sample.get("complete")).to.equal(0);
    });
  });

  describe("notes", function () {
    it("reads the notes text from the sample", function () {
      expect(new NotesViewModel({ sample: fakeSample({ notes: "hello" }) }).notes).to.equal("hello");
    });

    it("persists edited notes text to the sample", function () {
      const sample = fakeSample();
      const vm = new NotesViewModel({ sample });
      vm.setNotes("a new note");
      expect(sample.get("notes")).to.equal("a new note");
    });
  });

  describe("read-only mode", function () {
    it("is editable by default", function () {
      expect(new NotesViewModel({ sample: fakeSample() }).editable).to.be.true;
    });

    it("is not editable when constructed read-only", function () {
      expect(new NotesViewModel({ sample: fakeSample(), readonly: true }).editable).to.be.false;
    });
  });

  describe("navigation", function () {
    it("triggers a back event when goBack is called", function () {
      const vm = new NotesViewModel({ sample: fakeSample() });
      let fired = false;
      vm.on("back", () => { fired = true; });
      vm.goBack();
      expect(fired).to.be.true;
    });

    it("triggers a forward event when goForward is called", function () {
      const vm = new NotesViewModel({ sample: fakeSample() });
      let fired = false;
      vm.on("forward", () => { fired = true; });
      vm.goForward();
      expect(fired).to.be.true;
    });
  });
});
