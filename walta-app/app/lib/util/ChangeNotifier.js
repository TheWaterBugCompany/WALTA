// Flutter-compatible listener base class with a named-event
// emitter mixed in. Two distinct channels:
//
//   State-change broadcast (Flutter's `ChangeNotifier` contract):
//     addListener(cb)      — subscribe to "something changed"
//     removeListener(cb)
//     notifyListeners()    — fire all listeners, no arg
//
//   Named events (Flutter's `Stream`/`StreamController` analog):
//     on(event, cb)        — subscribe to a named event
//     off(event, cb)
//     trigger(event, data) — fire listeners for that event
//
// Both channels are cleared by dispose(). On port to Flutter, the
// named-event methods map naturally onto `StreamController.broadcast()`.

class ChangeNotifier {
  constructor() {
    this._listeners = [];
    this._eventListeners = {};
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

  on(event, cb) {
    (this._eventListeners[event] = this._eventListeners[event] || []).push(cb);
  }

  off(event, cb) {
    if (!this._eventListeners[event]) return;
    this._eventListeners[event] = this._eventListeners[event].filter(l => l !== cb);
  }

  trigger(event, data) {
    (this._eventListeners[event] || []).forEach(cb => cb(data));
  }

  dispose() {
    this._listeners = [];
    this._eventListeners = {};
  }
}

module.exports = ChangeNotifier;
