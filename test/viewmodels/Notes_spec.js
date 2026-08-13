require("mocha");
const { expect } = require("chai");
const NotesViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Notes");

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
  describe("survey date", function () {
    const NOW = new Date("2026-06-12T10:00:00");
    const fixedNow = () => NOW;

    it("defaults the survey date to now when the sample has no date", function () {
      const vm = new NotesViewModel({ sample: fakeSample(), now: fixedNow });
      expect(vm.surveyDate.getTime()).to.equal(NOW.getTime());
    });

    it("formats the survey date for display as 'D MMMM YYYY'", function () {
      const vm = new NotesViewModel({ sample: fakeSample(), now: fixedNow });
      expect(vm.surveyDateLabel).to.equal("12 June 2026");
    });

    it("persists a chosen date to the sample's overrideDateCompleted", function () {
      const sample = fakeSample();
      const vm = new NotesViewModel({ sample, now: fixedNow });
      const chosen = new Date("2020-01-02T03:04:05");
      vm.surveyDate = chosen;
      expect(new Date(sample.get("overrideDateCompleted")).getTime()).to.equal(chosen.getTime());
      expect(vm.surveyDateLabel).to.equal("2 January 2020");
    });

    it("reflects an existing override date stored on the sample", function () {
      const sample = fakeSample({ overrideDateCompleted: "2019-05-06T07:08:09" });
      const vm = new NotesViewModel({ sample, now: fixedNow });
      expect(vm.surveyDateLabel).to.equal("6 May 2019");
    });

    it("falls back to the sample's dateCompleted when viewing a completed sample", function () {
      const sample = fakeSample({ dateCompleted: "2018-03-04T05:06:07" });
      const vm = new NotesViewModel({ sample, now: fixedNow });
      expect(vm.surveyDateLabel).to.equal("4 March 2018");
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
      vm.complete = true;
      expect(sample.get("complete")).to.equal(1);
      vm.complete = false;
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
      vm.notes = "a new note";
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
});
