const ChangeNotifier = require("../util/ChangeNotifier");

// Per-row VM. Mutated in place across UPLOAD_PROGRESS ticks so the
// controller's bound Label widgets keep their UILabel instances — this
// is what avoids the WB-118 TiUILabel lazy-init crash on iOS 26.x.
class SampleRowViewModel extends ChangeNotifier {
  constructor(data) {
    super();
    this._data = data;
  }

  get id()            { return this._data.id; }
  get dateCompleted() { return this._data.dateCompleted; }
  get waterbodyName() { return this._data.waterbodyName; }
  get uploaded()      { return this._data.uploaded; }

  // Returns true (and notifies row listeners) only when something
  // actually changed, so an UPLOAD_PROGRESS tick that didn't move this
  // row is a no-op for its bound widgets.
  update(data) {
    if (rowDataEquals(this._data, data)) return false;
    this._data = data;
    this.notifyListeners();
    return true;
  }
}

function rowDataEquals(a, b) {
  return a.id === b.id
    && a.dateCompleted === b.dateCompleted
    && a.waterbodyName === b.waterbodyName
    && a.uploaded === b.uploaded;
}

class SampleHistoryViewModel extends ChangeNotifier {
  constructor({ sampleSource, topics }) {
    super();
    this._sampleSource = sampleSource;
    this._topics = topics;
    this._rows = sampleSource.loadAll().map(d => new SampleRowViewModel(d));

    this._onUploadProgress = (payload) => this._handleUploadProgress(payload);
    topics.subscribe(topics.UPLOAD_PROGRESS, this._onUploadProgress);
  }

  get rows() { return this._rows; }

  _handleUploadProgress(payload) {
    const id = payload && payload.id;
    if (id === undefined || id === null) return;

    const data = this._sampleSource.loadOne(id);
    const existingIdx = this._rows.findIndex(r => r.id === id);

    if (data && existingIdx >= 0) {
      this._rows[existingIdx].update(data);
      return;
    }
    if (data && existingIdx < 0) {
      this._rows = [new SampleRowViewModel(data), ...this._rows];
      this.notifyListeners();
      return;
    }
    if (!data && existingIdx >= 0) {
      this._rows = this._rows.filter((_, i) => i !== existingIdx);
      this.notifyListeners();
      return;
    }
    // !data && existingIdx < 0 — unknown id, nothing to do.
  }

  dispose() {
    this._topics.unsubscribe(this._topics.UPLOAD_PROGRESS, this._onUploadProgress);
    super.dispose();
  }
}

module.exports = SampleHistoryViewModel;
module.exports.SampleRowViewModel = SampleRowViewModel;
