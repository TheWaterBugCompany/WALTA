const ChangeNotifier = require("../../util/ChangeNotifier");

// State for the anchor-bar ice-cube button: whether this screen has a tray to
// go back to, and which one. Titanium-free.
//
// `allowAddToSample` is the signal for "reached from a tray" — it is already
// threaded through every identification path and is only true where a tray is
// waiting for the result. Identifying from the menu, or browsing out of an
// assessment, arrives with it false and gets no button.
class TrayButtonViewModel extends ChangeNotifier {
  constructor({ topics, allowAddToSample = false, training = false, onSelect }) {
    super();
    this._visible = allowAddToSample;
    this._topic = training ? topics.TRAININGTRAY : topics.SAMPLETRAY;
    this._onSelect = onSelect;
  }

  get visible() { return this._visible; }

  select() { this._onSelect(this._topic); }
}

module.exports = TrayButtonViewModel;
