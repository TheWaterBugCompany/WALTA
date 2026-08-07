const ChangeNotifier = require("../util/ChangeNotifier");

// State for the MethodSelect modal: which identification methods the caller may
// pick, and where each one routes. In training mode only the Key is offered —
// Speedbug, Browse and Unknown bug are disabled (the view greys them). Tapping a
// disabled entry does nothing. Titanium-free.
class MethodSelectViewModel extends ChangeNotifier {
  constructor({ topics, training = false, allowAddToSample = false, surveyType = null }) {
    super();
    this._topics = topics;
    this._training = training;
    this._payload = { allowAddToSample, surveyType };
  }

  get keysearchEnabled() { return true; }
  get speedbugEnabled() { return !this._training; }
  get browseEnabled() { return !this._training; }
  get unknownbugEnabled() { return !this._training; }

  keysearch() { this._route(this.keysearchEnabled, this._topics.KEYSEARCH, this._payload); }
  speedbug() { this._route(this.speedbugEnabled, this._topics.SPEEDBUG, this._payload); }
  browselist() { this._route(this.browseEnabled, this._topics.BROWSE, this._payload); }
  unknownbug() { this._route(this.unknownbugEnabled, this._topics.IDENTIFY, { taxonId: null }); }

  close() { this.trigger("close"); }

  _route(enabled, topic, data) {
    if (!enabled) return;
    this.trigger("close");
    this._topics.fireTopicEvent(topic, data);
  }
}

module.exports = MethodSelectViewModel;
