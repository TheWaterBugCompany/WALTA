require("mocha");
const { expect } = require("chai");
const AcademyViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Academy");
const Palette = require("../../walta-app/app/lib/util/Palette");

describe("AcademyViewModel", function () {
  let vm;
  // Default validator treats any complete 3-digit code as valid, so the entry
  // tests read naturally; the validity-specific tests inject their own.
  beforeEach(function () { vm = new AcademyViewModel({ isValidCode: (code) => code.length === 3 }); });

  // Records every box the keyboard is handed to, plus the end of entry, so a
  // test can assert on where typing left the caret.
  function recordEntryMoves(vm) {
    const moves = [];
    [1, 2, 3].forEach((n) => vm.on("focusDigit" + n, () => moves.push(n)));
    vm.on("codeComplete", () => moves.push("done"));
    return moves;
  }

  function type(vm, code) {
    String(code).split("").forEach((d, i) => { vm["digit" + (i + 1)] = d; });
  }

  it("starts empty with Start disabled", function () {
    expect(vm.digit1).to.equal("");
    expect(vm.digit2).to.equal("");
    expect(vm.digit3).to.equal("");
    expect(vm.code).to.equal("");
    expect(vm.startEnabled).to.equal(false);
  });

  it("assembles the code from the digits typed into each box", function () {
    type(vm, "123");
    expect(vm.code).to.equal("123");
  });

  it("moves the keyboard on to the next box once a digit is typed", function () {
    const moves = recordEntryMoves(vm);
    vm.digit1 = "1";
    expect(moves).to.deep.equal([2]);
  });

  it("steps the keyboard back a box when a digit is deleted", function () {
    type(vm, "10");
    const moves = recordEntryMoves(vm);
    vm.digit2 = "";
    expect(moves).to.deep.equal([1]);
  });

  it("dismisses the keyboard once the third digit lands, uncovering Start", function () {
    const moves = recordEntryMoves(vm);
    type(vm, "101");
    expect(moves).to.deep.equal([2, 3, "done"]);
  });

  it("leaves the keyboard where it is when the first box is cleared", function () {
    type(vm, "1");
    const moves = recordEntryMoves(vm);
    vm.digit1 = "";
    expect(moves).to.deep.equal([]);
  });

  it("leaves the keyboard where it is when a box is retyped with the same digit", function () {
    type(vm, "1");
    const moves = recordEntryMoves(vm);
    vm.digit1 = "1";
    expect(moves).to.deep.equal([]);
  });

  it("treats a cleared box as no digit", function () {
    type(vm, "123");
    vm.digit2 = null;
    expect(vm.digit2).to.equal("");
    expect(vm.code).to.equal("13");
  });

  it("retyping a box replaces its digit", function () {
    type(vm, "1");
    vm.digit1 = "9";
    expect(vm.digit1).to.equal("9");
  });

  it("enables Start only when all three digits are present", function () {
    type(vm, "12");
    expect(vm.startEnabled).to.equal(false);
    vm.digit3 = "3";
    expect(vm.startEnabled).to.equal(true);
  });

  it("enables Start only for a code that maps to a real exercise", function () {
    vm = new AcademyViewModel({ isValidCode: (code) => code === "101" });
    type(vm, "102");
    expect(vm.startEnabled).to.equal(false);
    vm.digit3 = "1";
    expect(vm.startEnabled).to.equal(true);
  });

  it("shows the Start button green when the code is valid, grey when not", function () {
    vm = new AcademyViewModel({ isValidCode: (code) => code === "101" });
    type(vm, "102");
    expect(vm.startColor).to.equal(Palette.disabled);
    vm.digit3 = "1";
    expect(vm.startColor).to.equal(Palette.success);
  });

  it("notifies listeners when a digit is typed", function () {
    let notified = 0;
    vm.addListener(() => notified++);
    vm.digit1 = "4";
    expect(notified).to.equal(1);
  });

  it("triggers 'start' with the code when Start is enabled", function () {
    type(vm, "456");
    let started = null;
    vm.on("start", (code) => { started = code; });
    vm.start();
    expect(started).to.equal("456");
  });

  it("does not trigger 'start' while the code is incomplete", function () {
    type(vm, "4");
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
