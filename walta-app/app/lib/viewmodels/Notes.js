const ChangeNotifier = require("../util/ChangeNotifier");

class NotesViewModel extends ChangeNotifier {
  constructor({ sample, readonly = false }) {
    super();
    this._sample = sample;
    this._readonly = readonly;
    this._overrideDateEnabled = Boolean(sample.get("overrideDateCompleted"));
  }

  get editable()            { return !this._readonly; }
  get complete()            { return Boolean(this._sample.get("complete")); }
  get notes()               { return this._sample.get("notes"); }
  get overrideDateEnabled() { return this._overrideDateEnabled; }
  get datePickerVisible()   { return this._overrideDateEnabled; }

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

  setOverrideDateEnabled(enabled) {
    this._overrideDateEnabled = enabled;
    if (!enabled) {
      this._sample.set("overrideDateCompleted", null);
      this._sample.save();
    }
    this.notifyListeners();
  }

  setOverrideDate(date) {
    if (this._overrideDateEnabled) {
      this._sample.set("overrideDateCompleted", date);
      this._sample.save();
    }
    this.notifyListeners();
  }
}

module.exports = NotesViewModel;
