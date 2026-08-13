const ChangeNotifier = require("../../util/ChangeNotifier");
const moment = require("../../lib/moment");

const DATE_LABEL_FORMAT = "D MMMM YYYY";

class NotesViewModel extends ChangeNotifier {
  constructor({ sample, readonly = false, now = () => new Date() }) {
    super();
    this._sample = sample;
    this._readonly = readonly;
    this._now = now;
  }

  get editable() { return !this._readonly; }

  get complete() { return Boolean(this._sample.get("complete")); }
  set complete(complete) {
    this._sample.set("complete", complete ? 1 : 0);
    this._persist();
  }

  get notes() { return this._sample.get("notes"); }
  set notes(notes) {
    this._sample.set("notes", notes);
    this._persist();
  }

  // The survey-collection date. Defaults to now so a same-day submission is
  // unchanged; an override (or, when viewing a completed sample, the recorded
  // dateCompleted) takes precedence. Assigning records an override.
  get surveyDate() {
    const stored = this._sample.get("overrideDateCompleted") || this._sample.get("dateCompleted");
    return stored ? new Date(stored) : this._now();
  }
  set surveyDate(date) {
    this._sample.set("overrideDateCompleted", moment(date).format());
    this._persist();
  }

  get surveyDateLabel() {
    return moment(this.surveyDate).format(DATE_LABEL_FORMAT);
  }

  _persist() {
    this._sample.save();
    this.notifyListeners();
  }
}

module.exports = NotesViewModel;
