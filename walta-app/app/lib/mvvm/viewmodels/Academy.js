const ChangeNotifier = require("../../util/ChangeNotifier");
const Palette = require("../../util/Palette");
const Belts = require("../../logic/Belts");
const BeltViewModel = require("./Belt");

// The course that earns each belt: level 1 is course 101, and so on up the
// ladder. Only the first is written so far — the rest have a belt but no video,
// which is what leaves Start disabled.
const FIRST_COURSE = 100;

const ACADEMY_URL = "https://waterbugblitz.org.au/academy";

// State for the Academy training-session start modal, in either of its two
// moods: offering the course that earns the next belt, or re-opening one whose
// belt is already won. A trainee is shown the belt they hold and the one the
// next course earns; which course that is follows from the level, so there is
// no code to enter.
// Titanium-free.
class AcademyViewModel extends ChangeNotifier {
  // `refreshing` is the level of an already-earned belt the trainee asked to go
  // back over; null is the ordinary climb up the ladder.
  constructor({ level = 0, refreshing = null, isValidCode } = {}) {
    super();
    this._level = level;
    this._refreshing = refreshing;
    this._isValidCode = isValidCode || (() => false);
    this._currentBeltVm = new BeltViewModel(this._beltOnShow);
    this._nextBeltVm = new BeltViewModel(this._nextBelt);
  }

  get isRefresh() { return this._refreshing !== null; }

  // The one belt the screen is about: the one being gone back over, or the one
  // the trainee is climbing from.
  get _beltOnShow() {
    return this.isRefresh
      ? Belts.at(this._refreshing)
      : Belts.at(this._level) || Belts.STARTING;
  }

  // A refresh earns nothing, so it has no next belt however far up the ladder
  // the trainee is.
  get _nextBelt() {
    if (this.isRefresh) return null;
    return this._level < Belts.HIGHEST ? Belts.at(this._level + 1) : null;
  }

  get currentBeltVm() { return this._currentBeltVm; }
  get nextBeltVm() { return this._nextBeltVm; }

  get currentMessage() {
    return this.isRefresh
      ? "You've already earned this belt, but you can refresh your knowledge:"
      : `You are currently a ${Belts.nameOf(this._beltOnShow)} belt:`;
  }

  // Nothing to offer once the highest belt is held, so the whole next-belt half
  // of the screen goes rather than naming a belt that does not exist.
  get nextVisible() { return Boolean(this._nextBelt); }

  get nextMessage() {
    return this.nextVisible
      ? `Complete your next course to earn a ${Belts.nameOf(this._nextBelt)} belt:`
      : null;
  }

  // The course is picked for the trainee either way, so the instruction names
  // which one to find on the website.
  get introMessage() {
    return this.isRefresh
      ? `Go to ${ACADEMY_URL} on a separate device, and select this course.`
      : `Go to ${ACADEMY_URL} on a separate device, and select your next course.`;
  }

  get actionLabel() { return this.isRefresh ? "Refresh" : "Start"; }

  // The course this screen opens: the one being gone back over, or the one that
  // earns the belt above the trainee's.
  get courseCode() {
    return String(FIRST_COURSE + (this.isRefresh ? this._refreshing : this._level + 1));
  }

  // The action is offered only for a course that has actually been written —
  // the green button is the "there is something to do" signal.
  get actionEnabled() {
    return (this.isRefresh || this.nextVisible) && this._isValidCode(this.courseCode);
  }
  get actionColor() { return this.actionEnabled ? Palette.success : Palette.disabled; }

  start() {
    if (this.actionEnabled) this.trigger("start", this.courseCode);
  }

  close() {
    this.trigger("close");
  }
}

module.exports = AcademyViewModel;
