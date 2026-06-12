const ChangeNotifier = require("../util/ChangeNotifier");
const moment = require("../lib/moment");

const DATE_LABEL_FORMAT = "D MMMM YYYY";

class NotesViewModel extends ChangeNotifier {
  constructor({ sample, readonly = false, now = () => new Date() }) {
    super();
    this._sample = sample;
    this._readonly = readonly;
    this._now = now;
  }

  get editable()  { return !this._readonly; }
  get complete()  { return Boolean(this._sample.get("complete")); }
  get notes()     { return this._sample.get("notes"); }

  // The survey-collection date. Defaults to now so a same-day submission is
  // unchanged; an override (or, when viewing a completed sample, the recorded
  // dateCompleted) takes precedence.
  get surveyDate() {
    const stored = this._sample.get("overrideDateCompleted") || this._sample.get("dateCompleted");
    return stored ? new Date(stored) : this._now();
  }

  get surveyDateLabel() {
    return moment(this.surveyDate).format(DATE_LABEL_FORMAT);
  }

  setSurveyDate(date) {
    this._sample.set("overrideDateCompleted", moment(date).format());
    this._sample.save();
    this.notifyListeners();
  }

  setComplete(complete) {
    this._sample.set("complete", complete ? 1 : 0);
    this._sample.save();
    this.notifyListeners();
  }

  setNotes(notes) {
    this._sample.set("notes", notes);
    this._sample.save();
    this.notifyListeners();
  }

  goBack()    { this.trigger("back"); }
  goForward() { this.trigger("forward"); }
}

module.exports = NotesViewModel;
