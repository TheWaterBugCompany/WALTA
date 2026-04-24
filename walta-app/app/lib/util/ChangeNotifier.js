// Flutter-compatible listener base class.
// Mirrors `foundation.ChangeNotifier` from Flutter so any VM or store
// that extends it can be ported mechanically. Consumers use
// `addListener(cb)` / `removeListener(cb)`; owners call
// `notifyListeners()` when observable state changes.

class ChangeNotifier {
  constructor() {
    this._listeners = [];
  }

  addListener(cb) {
    this._listeners.push(cb);
  }

  removeListener(cb) {
    this._listeners = this._listeners.filter(l => l !== cb);
  }

  notifyListeners() {
    this._listeners.forEach(cb => cb());
  }

  dispose() {
    this._listeners = [];
  }
}

module.exports = ChangeNotifier;
