require("mocha");
const { expect } = require("chai");
const AcademyViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Academy");
const Palette = require("../../walta-app/app/lib/util/Palette");

describe("AcademyViewModel", function () {
  let vm;
  // Default validator treats any complete 3-digit code as valid, so the picker /
  // start-trigger tests read naturally; the validity-specific tests inject their own.
  beforeEach(function () { vm = new AcademyViewModel({ isValidCode: (code) => code.length === 3 }); });

  it("starts empty with the picker hidden and Start disabled", function () {
    expect(vm.digit1).to.equal("");
    expect(vm.digit2).to.equal("");
    expect(vm.digit3).to.equal("");
    expect(vm.code).to.equal("");
    expect(vm.pickerVisible).to.equal(false);
    expect(vm.startEnabled).to.equal(false);
  });

  it("shows the picker while a box is being edited", function () {
    vm.startEditing(0);
    expect(vm.pickerVisible).to.equal(true);
  });

  it("fills the box being edited and hides the picker on pickDigit", function () {
    vm.startEditing(1);
    vm.pickDigit(7);
    expect(vm.digit2).to.equal("7");
    expect(vm.pickerVisible).to.equal(false);
  });

  it("assembles the code from digits picked into each box", function () {
    vm.startEditing(0); vm.pickDigit(1);
    vm.startEditing(1); vm.pickDigit(2);
    vm.startEditing(2); vm.pickDigit(3);
    expect(vm.code).to.equal("123");
  });

  it("ignores pickDigit when no box is being edited", function () {
    vm.pickDigit(5);
    expect(vm.code).to.equal("");
    expect(vm.pickerVisible).to.equal(false);
  });

  it("re-editing a box replaces its digit", function () {
    vm.startEditing(0); vm.pickDigit(1);
    vm.startEditing(0); vm.pickDigit(9);
    expect(vm.digit1).to.equal("9");
  });

  it("hides the picker without changing digits on cancelPicker", function () {
    vm.startEditing(0); vm.pickDigit(1);
    vm.startEditing(1);
    vm.cancelPicker();
    expect(vm.pickerVisible).to.equal(false);
    expect(vm.code).to.equal("1");
  });

  it("enables Start only when all three digits are present", function () {
    vm.startEditing(0); vm.pickDigit(1);
    vm.startEditing(1); vm.pickDigit(2);
    expect(vm.startEnabled).to.equal(false);
    vm.startEditing(2); vm.pickDigit(3);
    expect(vm.startEnabled).to.equal(true);
  });

  it("enables Start only for a code that maps to a real exercise", function () {
    vm = new AcademyViewModel({ isValidCode: (code) => code === "101" });
    vm.startEditing(0); vm.pickDigit(1);
    vm.startEditing(1); vm.pickDigit(0);
    vm.startEditing(2); vm.pickDigit(2);   // "102" — not an exercise
    expect(vm.startEnabled).to.equal(false);
    vm.startEditing(2); vm.pickDigit(1);   // "101" — valid
    expect(vm.startEnabled).to.equal(true);
  });

  it("shows the Start button green when the code is valid, grey when not", function () {
    vm = new AcademyViewModel({ isValidCode: (code) => code === "101" });
    vm.startEditing(0); vm.pickDigit(9);   // invalid so far
    expect(vm.startColor).to.equal(Palette.disabled);
    vm.startEditing(0); vm.pickDigit(1);
    vm.startEditing(1); vm.pickDigit(0);
    vm.startEditing(2); vm.pickDigit(1);   // "101"
    expect(vm.startColor).to.equal(Palette.success);
  });

  it("notifies listeners when editing starts", function () {
    let notified = 0;
    vm.addListener(() => notified++);
    vm.startEditing(0);
    expect(notified).to.equal(1);
  });

  it("notifies listeners when a digit is picked", function () {
    vm.startEditing(0);
    let notified = 0;
    vm.addListener(() => notified++);
    vm.pickDigit(4);
    expect(notified).to.equal(1);
  });

  it("triggers 'start' with the code when Start is enabled", function () {
    vm.startEditing(0); vm.pickDigit(4);
    vm.startEditing(1); vm.pickDigit(5);
    vm.startEditing(2); vm.pickDigit(6);
    let started = null;
    vm.on("start", (code) => { started = code; });
    vm.start();
    expect(started).to.equal("456");
  });

  it("does not trigger 'start' while the code is incomplete", function () {
    vm.startEditing(0); vm.pickDigit(4);
    let started = false;
    vm.on("start", () => { started = true; });
    vm.start();
    expect(started).to.equal(false);
  });

  it("triggers 'close' on close()", function () {
    let closed = false;
    vm.on("close", () => { closed = true; });
    vm.close();
    expect(closed).to.equal(true);
  });
});
