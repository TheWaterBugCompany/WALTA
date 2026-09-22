const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");
const Belts = require("../../logic/Belts");
const BeltViewModel = require("./Belt");

// The course that earns each belt: level 1 is course 101, and so on up the
// ladder. Only the first is written so far — the rest have a belt but no video,
// which is what leaves Start disabled.
const FIRST_COURSE = 100;

// State for the Academy training-session start modal. A trainee is shown the
// belt they hold and the one the next course earns; which course that is
// follows from the level, so there is no code to enter.
// Titanium-free.
class AcademyViewModel extends ChangeNotifier {
  constructor({ level = 0, isValidCode } = {}) {
    super();
    this._level = level;
    this._isValidCode = isValidCode || (() => false);
    this._currentBeltVm = new BeltViewModel(Belts.at(level) || Belts.STARTING);
    this._nextBeltVm = new BeltViewModel(this._nextBelt);
  }

  get _nextBelt() {
    return this._level < Belts.HIGHEST ? Belts.at(this._level + 1) : null;
  }

  get currentBeltVm() { return this._currentBeltVm; }
  get nextBeltVm() { return this._nextBeltVm; }

  get currentMessage() {
    return `You are currently a ${Belts.nameOf(Belts.at(this._level) || Belts.STARTING)} belt:`;
  }

  // Nothing to offer once the highest belt is held, so the whole next-belt half
  // of the screen goes rather than naming a belt that does not exist.
  get nextVisible() { return Boolean(this._nextBelt); }

  get nextMessage() {
    return this.nextVisible
      ? `Complete your next course to earn a ${Belts.nameOf(this._nextBelt)} belt:`
      : null;
  }

  get nextCourse() { return String(FIRST_COURSE + this._level + 1); }

  // Start is offered only for a course that has actually been written — the
  // green button is the "there is something to do" signal.
  get startEnabled() { return this.nextVisible && this._isValidCode(this.nextCourse); }
  get startColor() { return this.startEnabled ? Palette.success : Palette.disabled; }

  start() {
    if (this.startEnabled) this.trigger("start", this.nextCourse);
  }

  close() {
    this.trigger("close");
  }
}

module.exports = AcademyViewModel;
