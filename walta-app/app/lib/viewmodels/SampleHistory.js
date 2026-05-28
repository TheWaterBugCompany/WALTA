const ChangeNotifier = require("../util/ChangeNotifier");

// Per-row VM. Mutated in place across reloads so the controller's bound
// Label widgets keep their UILabel instances — this is what avoids the
// WB-118 TiUILabel lazy-init crash on iOS 26.x.
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
    this._onSyncFinished   = ()        => this._handleSyncFinished();
    topics.subscribe(topics.UPLOAD_PROGRESS, this._onUploadProgress);
    topics.subscribe(topics.SYNC_FINISHED,   this._onSyncFinished);
  }

  get rows() { return this._rows; }

  _handleUploadProgress(payload) {
    const id = payload && payload.id;
    if (id === undefined || id === null) return;
    const row = this._rows.find(r => r.id === id);
    if (!row) return;
    const data = this._sampleSource.loadOne(id);
    if (!data) return;
    row.update(data);
  }

  _handleSyncFinished() {
    const incoming = this._sampleSource.loadAll();
    const byId = new Map(this._rows.map(r => [r.id, r]));
    const before = this._rows;
    const next = incoming.map(d => {
      const existing = byId.get(d.id);
      if (existing) {
        existing.update(d);
        return existing;
      }
      return new SampleRowViewModel(d);
    });
    this._rows = next;
    if (structureChanged(before, next)) {
      this.notifyListeners();
    }
  }

  dispose() {
    this._topics.unsubscribe(this._topics.UPLOAD_PROGRESS, this._onUploadProgress);
    this._topics.unsubscribe(this._topics.SYNC_FINISHED,   this._onSyncFinished);
    super.dispose();
  }
}

function structureChanged(before, after) {
  if (before.length !== after.length) return true;
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) return true;
  }
  return false;
}

module.exports = SampleHistoryViewModel;
module.exports.SampleRowViewModel = SampleRowViewModel;
