const ChangeNotifier = require("../util/ChangeNotifier");

class SampleRowViewModel extends ChangeNotifier {
  constructor(data) {
    super();
    this._data = data;
  }

  get id()            { return this._data.id; }
  get dateCompleted() { return this._data.dateCompleted; }
  get waterbodyName() { return this._data.waterbodyName; }
  get uploaded()      { return this._data.uploaded; }

  update(data) {
    if (this._dataEquals(data)) return false;
    this._data = data;
    this.notifyListeners();
    return true;
  }

  _dataEquals(other) {
    const a = this._data;
    return a.id === other.id
      && a.dateCompleted === other.dateCompleted
      && a.waterbodyName === other.waterbodyName
      && a.uploaded === other.uploaded;
  }
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
    if (id === undefined || id === null) {
      throw new Error("SampleHistoryViewModel: UPLOAD_PROGRESS payload missing id: " + JSON.stringify(payload));
    }

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
    throw new Error("SampleHistoryViewModel: UPLOAD_PROGRESS for unknown sample id " + id + " (not in rows and no source data)");
  }

  dispose() {
    this._topics.unsubscribe(this._topics.UPLOAD_PROGRESS, this._onUploadProgress);
    super.dispose();
  }
}

module.exports = SampleHistoryViewModel;
module.exports.SampleRowViewModel = SampleRowViewModel;
